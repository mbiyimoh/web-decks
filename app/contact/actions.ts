'use server';

import { prisma } from '@/lib/prisma';
import { CONTACT_INTERESTS } from '@/lib/contact-interests';

interface ContactFormData {
  name: string;
  email: string;
  interests: string[];
  message?: string;
  source?: string;
}

export async function submitContactForm(data: ContactFormData) {
  // Validate required fields
  if (!data.name || !data.email || data.interests.length === 0) {
    return { success: false, error: 'Missing required fields' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, error: 'Invalid email address' };
  }

  try {
    // 1. Save to database
    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        interests: data.interests,
        message: data.message || null,
        source: data.source || null,
      },
    });

    // 2. Send Slack notification and track result
    const { success: slackSuccess, error: slackError } = await sendSlackNotification(
      submission,
      data
    );

    // 3. Update submission with notification status
    await prisma.contactSubmission.update({
      where: { id: submission.id },
      data: {
        slackNotificationSent: slackSuccess,
        slackNotificationError: slackError || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { success: false, error: 'Failed to submit. Please try again.' };
  }
}

async function sendSlackNotification(
  submission: { id: string; createdAt: Date },
  data: ContactFormData
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.SLACK_CONTACT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_CONTACT_WEBHOOK_URL not configured, skipping notification');
    return { success: false, error: 'Webhook URL not configured' };
  }

  // Map interest IDs to labels
  const interestLabels = data.interests.map((id) => {
    const interest = CONTACT_INTERESTS.find((i) => i.id === id);
    return interest?.label || id;
  });

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'New Contact Form Submission',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${data.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${data.email}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Interested in:*\n${interestLabels.map((l) => `• ${l}`).join('\n')}`,
        },
      },
      ...(data.message
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:*\n${data.message}`,
              },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Source: ${data.source || 'direct'} | ID: ${submission.id}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMsg = `Slack notification failed: ${response.status}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (error) {
    // Don't fail the submission if Slack fails
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Slack notification error:', error);
    return { success: false, error: errorMsg };
  }
}

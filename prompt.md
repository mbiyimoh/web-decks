## 6) Clarifications

The following decisions would help refine the implementation:

### 1. Password Configuration
**Question:** How should the password be set?
- **Option A:** Single environment variable (`DECK_PASSWORD=yourpassword`)
- **Option B:** Multiple passwords allowed (comma-separated in env var)
- **Recommendation:** Option A for simplicity
>> option A

### 2. Session Duration
**Question:** How long should users stay logged in before needing to re-enter the password?
- **Option A:** Until browser closes (session cookie)
- **Option B:** 24 hours
- **Option C:** 7 days
- **Option D:** 30 days
- **Recommendation:** Option C (7 days) - convenient for investors reviewing multiple times
>> option C

### 3. Login Page Branding
**Question:** What should the password page look like?
- **Option A:** Minimal - just password field and submit button
- **Option B:** Branded - Tradeblock logo, brief "Enter password to view" message
- **Option C:** Custom message - explain context, maybe your contact info
- **Recommendation:** Option B - professional but not over-designed
>> option B

### 4. Custom Domain
**Question:** Do you have a custom domain in mind?
- **Option A:** Use Railway's default `*.up.railway.app` domain initially
- **Option B:** Set up custom domain immediately (you'd need to own/configure DNS)
- **Recommendation:** Option A initially, add custom domain later
>> option A for now

### 5. GitHub Repository Name
**Question:** What should the GitHub repository be named?
- Suggestions: `tradeblock-deck`, `web-decks`, `pitch-decks`, `tradeblock-ai-pitch`
- This affects the Railway project name and default URL
>> I went ahead and created it already: git@github.com:mbiyimoh/web-decks.git


### 6. Error Handling
**Question:** What happens when someone enters the wrong password?
- **Option A:** Simple "Invalid password" message, retry allowed
- **Option B:** Rate limiting after 5 failed attempts (15-minute lockout)
- **Recommendation:** Option A initially (Option B adds complexity)
>> option A
import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
  }

  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
  }
}

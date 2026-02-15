import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    studentId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      role: string;
      studentId: string | null;
    };
  }
}

// JWT type augmentation handled via session callbacks in auth config

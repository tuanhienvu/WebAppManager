import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import type { IncomingMessage } from 'http';
import { parse } from 'cookie';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
}

export interface SessionData extends SessionUser {
  expiresAt: number;
}

export function parseSessionCookie(cookieHeader?: string): SessionData | null {
  if (!cookieHeader) {
    return null;
  }
  const cookies = parse(cookieHeader);
  const raw = cookies['auth-session'];
  if (!raw) {
    return null;
  }
  try {
    const session = JSON.parse(raw) as SessionData;
    if (!session?.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req?: IncomingMessage | null): SessionData | null {
  if (!req) {
    return null;
  }
  return parseSessionCookie(req.headers.cookie);
}

type AuthenticatedRequest = IncomingMessage & {
  session?: SessionData;
};

export function withAuth<P extends Record<string, unknown> = Record<string, unknown>>(
  gssp?: GetServerSideProps<P>,
): GetServerSideProps<P> {
  return async (context: GetServerSidePropsContext) => {
    const session = getSessionFromRequest(context.req);

    if (!session) {
      const redirectTo = encodeURIComponent(context.resolvedUrl ?? '/');
      return {
        redirect: {
          destination: `/login?redirectTo=${redirectTo}`,
          permanent: false,
        },
      };
    }

    (context.req as AuthenticatedRequest).session = session;

    if (gssp) {
      return gssp(context);
    }

    return {
      props: {} as P,
    };
  };
}


import { Link as RouterLink, useRouter, useRouterState } from '@tanstack/react-router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick' | 'title' | 'aria-label'> & {
  to: string;
  end?: boolean;
  children?: ReactNode;
  className?: string | ((state: { isActive: boolean }) => string);
};

export function Link({ to, end, className, children, ...props }: Props) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActive = end ? pathname.replace(/\/$/, '') === to : pathname.startsWith(to);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return <RouterLink to={to} {...(resolvedClassName ? { className: resolvedClassName } : {})} {...props}>{children}</RouterLink>;
}

export const NavLink = Link;
export function useLocation() {
  return useRouterState({ select: (state) => state.location });
}
export function useNavigate() {
  const router = useRouter();
  return (to: string) => router.navigate({ to });
}
export function useSearchParams(): [URLSearchParams, (params: Record<string, string>) => void] {
  const location = useLocation();
  const router = useRouter();
  return [new URLSearchParams(location.searchStr), (params) => {
    void router.navigate({ to: location.pathname, search: params });
  }];
}
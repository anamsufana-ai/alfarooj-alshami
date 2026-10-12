"use client";

import { useActionState } from "react";
import { loginAction, logoutAction, registerAction, setupAdminAction } from "@/server/customer-actions";
import { copy, type Locale } from "@/i18n/copy";

export function LoginForm({ locale }: { locale: Locale }) {
  const text = copy(locale);
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form className="panel" action={action}>
      <input type="hidden" name="locale" value={locale} />
      <label>{text.email}<input name="email" type="email" required /></label>
      <label>{text.password}<input name="password" type="password" minLength={10} required /></label>
      {state?.error ? <p role="alert">{state.error}</p> : null}
      <button disabled={pending}>{text.login}</button>
    </form>
  );
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const text = copy(locale);
  const [state, action, pending] = useActionState(registerAction, null);
  return (
    <form className="panel" action={action}>
      <input type="hidden" name="locale" value={locale} />
      <label>{text.name}<input name="name" required minLength={2} /></label>
      <label>{text.phoneLabel}<input name="phone" required /></label>
      <label>{text.email}<input name="email" type="email" required /></label>
      <label>{text.password}<input name="password" type="password" minLength={10} required /></label>
      {state?.error ? <p role="alert">{state.error}</p> : null}
      <button disabled={pending}>{text.register}</button>
    </form>
  );
}

export function SetupForm({ locale }: { locale: Locale }) {
  const text = copy(locale);
  const [state, action, pending] = useActionState(setupAdminAction, null);
  return (
    <form className="panel" action={action}>
      <input type="hidden" name="locale" value={locale} />
      <label>{text.name}<input name="name" required minLength={2} /></label>
      <label>{text.email}<input name="email" type="email" required /></label>
      <label>{text.password}<input name="password" type="password" minLength={10} required /></label>
      {state?.error ? <p role="alert">{state.error}</p> : null}
      <button disabled={pending}>{text.setup}</button>
    </form>
  );
}

export function LogoutButton({ locale }: { locale: Locale }) {
  const text = copy(locale);
  return <form action={logoutAction.bind(null, locale)}><button className="quiet" type="submit">{text.logout}</button></form>;
}

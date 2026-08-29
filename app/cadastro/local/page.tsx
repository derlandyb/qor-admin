"use client";

import { useState } from "react";

import { RegistrationForm } from "@/components/design-system/RegistrationForm";
import { useVenueRegistration } from "@/hooks/useRegistration";
import type { RegisterPromoterPayload, RegisterVenuePayload } from "@/lib/api/types";

export default function CadastroLocalPage() {
  const { register, isSubmitting, error } = useVenueRegistration();
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(payload: RegisterVenuePayload | RegisterPromoterPayload) {
    const venue = await register(payload as RegisterVenuePayload);
    if (venue) {
      setRegistered(true);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-admin-bg-body px-4 py-12">
      <div className="w-full max-w-[560px] rounded-admin-card bg-admin-bg-surface p-8">
        <h1 className="text-2xl font-semibold text-admin-text-primary">Cadastro de Local</h1>

        {registered ? (
          // ADMIN-03: the created account starts as Pending Approval and is
          // blocked from write actions (e.g. creating events) until an
          // admin approves it — so this success state does not redirect
          // to a dashboard, there is nothing to see there yet.
          <p className="mt-6 text-sm text-admin-text-secondary" role="status">
            Cadastro enviado! Sua conta será analisada pela nossa equipe.
          </p>
        ) : (
          <>
            <p className="mt-1 mb-6 text-sm text-admin-text-secondary">
              Cadastre seu local na QOR para divulgar seus eventos.
            </p>
            <RegistrationForm
              kind="venue"
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              serverError={error}
            />
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";

import { getLayout } from "@calcom/features/settings/layouts/SettingsLayout";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { RouterOutputs } from "@calcom/trpc/react";
import { Meta, showToast, NewToggle } from "@calcom/ui";

import PageWrapper from "@components/PageWrapper";

const ProfileImpersonationView = ({ user }: { user: RouterOutputs["viewer"]["me"] }) => {
  const { t } = useLocale();
  const utils = trpc.useContext();
  const [disableImpersonation, setDisableImpersonation] = useState<boolean | undefined>(
    user?.disableImpersonation
  );

  const mutation = trpc.viewer.updateProfile.useMutation({
    onSuccess: () => {
      showToast(t("profile_updated_successfully"), "success");
    },
    onSettled: () => {
      utils.viewer.me.invalidate();
    },
    onMutate: async ({ disableImpersonation }) => {
      await utils.viewer.me.cancel();
      const previousValue = utils.viewer.me.getData();

      setDisableImpersonation(disableImpersonation);

      return { previousValue };
    },
    onError: (error, variables, context) => {
      if (context?.previousValue) {
        utils.viewer.me.setData(undefined, context.previousValue);
        setDisableImpersonation(context.previousValue);
      }
      showToast(`${t("error")}, ${error.message}`, "error");
    },
  });

  return (
    <>
      <Meta title={t("impersonation")} description={t("impersonation_description")} />
      <div className="border-subtle rounded-b-xl border-x border-b p-6">
        <NewToggle
          title={t("user_impersonation_heading")}
          description={t("user_impersonation_description")}
          checked={!disableImpersonation}
          onCheckedChange={(checked) => {
            mutation.mutate({ disableImpersonation: !checked });
          }}
          disabled={mutation.isLoading}
        />
      </div>
    </>
  );
};

const ProfileImpersonationViewWrapper = () => {
  const { data: user, isLoading } = trpc.viewer.me.useQuery();

  if (isLoading || !user) return null;
  return <ProfileImpersonationView user={user} />;
};

ProfileImpersonationViewWrapper.getLayout = getLayout;
ProfileImpersonationViewWrapper.PageWrapper = PageWrapper;

export default ProfileImpersonationViewWrapper;

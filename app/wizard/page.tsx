import { OnboardingWizard } from "@/components/wizard/onboarding-wizard";
import { listPromptTemplates } from "@/lib/data/prompt-templates";
import { getOrCreateDraftSession } from "@/lib/data/onboarding";

export default async function WizardPage() {
  const [session, templates] = await Promise.all([
    getOrCreateDraftSession(),
    listPromptTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI 서비스 온보딩</h1>
        <p className="text-muted-foreground">
          목적/대상을 선택하고 10분 이내에 Vercel 배포까지 이어집니다.
        </p>
      </div>
      <OnboardingWizard session={session} templates={templates} />
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { COMBO_PRESETS } from "@/lib/constants";
import type {
  AIProvider,
  ComboType,
  OnboardingSession,
  PromptTemplate,
} from "@/lib/types";

const PURPOSE_OPTIONS = [
  {
    id: "customer-care",
    label: "고객 지원 Copilot",
    description: "티켓 분류 · 답변 초안 · 품질 요약",
    comboType: "enterprise" as ComboType,
    templateTags: ["enterprise", "support"],
  },
  {
    id: "marketing",
    label: "마케팅 캠페인 자동화",
    description: "랜딩 페이지 · 이메일 · A/B 브리프",
    comboType: "web" as ComboType,
    templateTags: ["web", "marketing"],
  },
  {
    id: "builder",
    label: "메타 프로그래밍 워크샵",
    description: "코드를 위한 코드 · 에이전트 체인",
    comboType: "custom" as ComboType,
    templateTags: ["custom", "builder"],
  },
  {
    id: "field",
    label: "현장/모바일 운영",
    description: "모바일 체크리스트 · 설문",
    comboType: "app" as ComboType,
    templateTags: ["app", "field"]
  },
] as const;

const AUDIENCE_OPTIONS = [
  { id: "enterprise", label: "엔터프라이즈 운영팀", tone: "보안/컴플라이언스 우선" },
  { id: "startup", label: "스타트업/스케일업", tone: "빠른 실험 · 저비용" },
  { id: "consumer", label: "일반 소비자", tone: "다국어 · 접근성" },
  { id: "internal", label: "사내 전사", tone: "메타 프로그래밍 + 자동 수정" },
] as const;

const MODEL_OPTIONS = [
  {
    id: "cowi_free",
    provider: "cowi_free" as AIProvider,
    label: "Cowi Free Preview",
    description: "테스트용 공유 키, 요금 없음",
    doc: "https://docs.cowi.dev/free-tier",
  },
  {
    id: "openai",
    provider: "openai" as AIProvider,
    label: "OpenAI GPT-4o",
    description: "고품질 멀티모달, 운영 자동화",
    doc: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    provider: "anthropic" as AIProvider,
    label: "Anthropic Claude",
    description: "긴 컨텍스트, 안전성 우선",
    doc: "https://console.anthropic.com/account/keys",
  },
  {
    id: "custom",
    provider: "custom" as AIProvider,
    label: "커스텀 JSON Provider",
    description: "사내 프록시/온프렘 연결",
    doc: "https://docs.cowi.dev/providers",
  },
] as const;

const HOSTING_OPTIONS = [
  { id: "vercel", label: "Vercel", description: "10분 이내 자동 배포", deployHookOverride: null },
  { id: "concept_aws", label: "AWS (Concept)", description: "향후 EKS/Lambda 확장", deployHookOverride: null },
  { id: "concept_netlify", label: "Netlify (Concept)", description: "Jamstack 팀 공유", deployHookOverride: null },
] as const;

const STEPS = [
  { id: "purpose", title: "목적" },
  { id: "audience", title: "대상" },
  { id: "model", title: "모델" },
  { id: "hosting", title: "호스팅" },
  { id: "apikey", title: "API Key" },
  { id: "template", title: "추천 템플릿" },
  { id: "summary", title: "요약/배포" },
] as const;

interface OnboardingWizardProps {
  session: OnboardingSession;
  templates: PromptTemplate[];
}

export function OnboardingWizard({ session, templates }: OnboardingWizardProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const initialMetadata = useMemo(
    () => (session.metadata as Record<string, unknown>) ?? {},
    [session.metadata]
  );
  const [metadataState, setMetadataState] = useState<Record<string, unknown>>(initialMetadata);

  const [purposeId, setPurposeId] = useState<string | null>(
    () => (initialMetadata.purposeId as string) ?? null
  );
  const [audienceId, setAudienceId] = useState<string | null>(
    () => (initialMetadata.audienceId as string) ?? null
  );
  const [modelId, setModelId] = useState<string | null>(
    () => (initialMetadata.modelId as string) ?? null
  );
  const [hostingId, setHostingId] = useState<string | null>(
    () => (initialMetadata.hostingId as string) ?? "vercel"
  );
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyValid, setApiKeyValid] = useState(Boolean(session.api_key_last_four));
  const [apiKeyLastFour, setApiKeyLastFour] = useState(session.api_key_last_four ?? null);
  const [apiMessage, setApiMessage] = useState<string | null>(
    session.api_key_last_four ? "이전에 검증됨" : null
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() =>
    session.recommend_template_id ?? null
  );

  const selectedPurpose = PURPOSE_OPTIONS.find((option) => option.id === purposeId) ?? null;
  const comboPresetMap = useMemo(() => Object.fromEntries(COMBO_PRESETS.map((preset) => [preset.id, preset])), []);
  const targetCombo = selectedPurpose?.comboType ?? "web";
  const defaultStack = comboPresetMap[targetCombo]?.defaultStack ?? "nextjs-web";

  const recommendedTemplates = useMemo(() => {
    return templates
      .filter((template) => template.combo_type === targetCombo || template.combo_type === "all")
      .slice(0, 4);
  }, [targetCombo, templates]);

  const selectedTemplate = recommendedTemplates.find((tpl) => tpl.id === selectedTemplateId) ?? null;
  const selectedModel = MODEL_OPTIONS.find((option) => option.id === modelId) ?? null;
  const selectedHosting = HOSTING_OPTIONS.find((option) => option.id === hostingId) ?? HOSTING_OPTIONS[0];

  const canProceedSummary =
    Boolean(purposeId && audienceId && selectedModel && hostingId) &&
    (selectedModel?.provider === "cowi_free" || apiKeyValid);

  const canComplete = canProceedSummary && Boolean(selectedTemplate);

  const persistSession = useCallback(
    async (update: Record<string, unknown>, metadataPatch?: Record<string, unknown>) => {
      setErrorMessage(null);
      setSaving(true);
      try {
        let nextMetadata = metadataState;
        if (metadataPatch) {
          nextMetadata = { ...metadataState, ...metadataPatch };
          setMetadataState(nextMetadata);
        }
        const payload = {
          ...update,
          ...(metadataPatch ? { metadata: nextMetadata } : {}),
        };
        const response = await fetch(`/api/wizard/session/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "세션 저장 실패");
        }
      } catch (error) {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : "세션 저장 실패");
      } finally {
        setSaving(false);
      }
    },
    [session.id, metadataState]
  );

  async function handlePurposeSelect(option: (typeof PURPOSE_OPTIONS)[number]) {
    setPurposeId(option.id);
    await persistSession(
      { purpose: option.label },
      { purposeId: option.id, comboType: option.comboType }
    );
    setStatusMessage("목적 저장됨");
  }

  async function handleAudienceSelect(option: (typeof AUDIENCE_OPTIONS)[number]) {
    setAudienceId(option.id);
    await persistSession(
      { target_audience: option.label },
      { audienceId: option.id }
    );
    setStatusMessage("대상 저장됨");
  }

  async function handleModelSelect(option: (typeof MODEL_OPTIONS)[number]) {
    setModelId(option.id);
    await persistSession(
      { model_preference: option.label, api_provider: option.provider },
      { modelId: option.id }
    );
    setStatusMessage("모델 저장됨");
  }

  async function handleHostingSelect(option: (typeof HOSTING_OPTIONS)[number]) {
    setHostingId(option.id);
    await persistSession(
      { hosting_target: option.label },
      { hostingId: option.id, vercelHookOverride: option.deployHookOverride }
    );
    setStatusMessage("호스팅 저장됨");
  }

  async function handleTemplateSelect(template: PromptTemplate) {
    setSelectedTemplateId(template.id);
    await persistSession(
      { recommend_template_id: template.id },
      { templateId: template.id }
    );
    setStatusMessage("템플릿이 적용되었습니다");
  }

  async function handleValidateApiKey() {
    if (!selectedModel) {
      setApiMessage("먼저 모델을 선택하세요");
      return;
    }

    if (selectedModel.provider !== "cowi_free" && !apiKeyInput) {
      setApiMessage("API Key를 입력하세요");
      return;
    }

    setValidatingKey(true);
    setApiMessage(null);
    try {
      const response = await fetch("/api/wizard/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedModel.provider, apiKey: apiKeyInput }),
      });
      const result = await response.json();
      if (!response.ok || !result.valid) {
        setApiKeyValid(false);
        setApiMessage(result.message ?? "검증 실패");
        return;
      }
      setApiKeyValid(true);
      const lastFour = apiKeyInput.slice(-4);
      setApiKeyLastFour(lastFour);
      setApiMessage(result.message ?? "검증 완료");
      await persistSession(
        { api_key_last_four: lastFour },
        { apiValidatedAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error(error);
      setApiKeyValid(false);
      setApiMessage(error instanceof Error ? error.message : "검증 실패");
    } finally {
      setValidatingKey(false);
    }
  }

  async function handleComplete() {
    if (!canComplete || !selectedPurpose || !selectedTemplate || !selectedModel) {
      setErrorMessage("모든 단계를 완료하세요");
      return;
    }

    setDeploying(true);
    setErrorMessage(null);
    try {
      const payload = {
        comboType: selectedPurpose.comboType,
        stack: defaultStack,
        projectTitle: `${selectedPurpose.label} · ${selectedModel.label}`,
        promptText: selectedTemplate.content,
        recommendTemplateId: selectedTemplate.id,
        metadata: {
          purposeId,
          audienceId,
          modelId,
          hostingId,
          apiKeyLastFour,
          comboType: selectedPurpose.comboType,
          summary: `${selectedPurpose.label} for ${audienceId ?? "team"}`,
        },
      };

      const response = await fetch(`/api/wizard/session/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "배포 트리거 실패");
      }

      const { project } = await response.json();
      setStatusMessage("프로젝트 생성 및 배포 트리거 완료");
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "배포 실패");
    } finally {
      setDeploying(false);
    }
  }

  function goNext() {
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  }

  function goPrev() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  const currentStep = STEPS[stepIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle>설문형 온보딩 마법사</CardTitle>
        <CardDescription>
          목적 · 대상 · 모델을 고르면 추천 템플릿과 함께 Vercel 자동 배포를 시작합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((step, index) => (
            <Badge
              key={step.id}
              variant={index === stepIndex ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStepIndex(index)}
            >
              {step.title}
            </Badge>
          ))}
        </div>

        <Separator />

        {currentStep.id === "purpose" && (
          <div className="grid gap-4 md:grid-cols-2">
            {PURPOSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`rounded-lg border p-4 text-left transition ${option.id === purposeId ? "border-primary bg-primary/5" : "hover:border-foreground"}`}
                onClick={() => void handlePurposeSelect(option)}
              >
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{option.comboType.toUpperCase()} combo</p>
              </button>
            ))}
          </div>
        )}

        {currentStep.id === "audience" && (
          <div className="grid gap-4 md:grid-cols-2">
            {AUDIENCE_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`rounded-lg border p-4 text-left transition ${option.id === audienceId ? "border-primary bg-primary/5" : "hover:border-foreground"}`}
                onClick={() => void handleAudienceSelect(option)}
              >
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.tone}</p>
              </button>
            ))}
          </div>
        )}

        {currentStep.id === "model" && (
          <div className="grid gap-4 md:grid-cols-2">
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`rounded-lg border p-4 text-left transition ${option.id === modelId ? "border-primary bg-primary/5" : "hover:border-foreground"}`}
                onClick={() => void handleModelSelect(option)}
              >
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <a
                  className="text-xs text-primary"
                  href={option.doc}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  키 발급 링크 →
                </a>
              </button>
            ))}
          </div>
        )}

        {currentStep.id === "hosting" && (
          <div className="grid gap-4 md:grid-cols-3">
            {HOSTING_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`rounded-lg border p-4 text-left transition ${option.id === hostingId ? "border-primary bg-primary/5" : "hover:border-foreground"}`}
                onClick={() => void handleHostingSelect(option)}
              >
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        )}

        {currentStep.id === "apikey" && (
          <div className="space-y-4">
            {selectedModel?.provider === "cowi_free" ? (
              <p className="text-sm text-muted-foreground">
                Cowi Free tier는 별도 키가 필요 없습니다. 다음 단계로 이동하세요.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="api-key-input">{selectedModel?.label ?? "API Key"}</Label>
                <Input
                  id="api-key-input"
                  type="password"
                  value={apiKeyInput}
                  onChange={(event) => setApiKeyInput(event.target.value)}
                  placeholder="sk-..."
                />
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" onClick={() => void handleValidateApiKey()} disabled={validatingKey}>
                    {validatingKey ? "검증 중..." : "API Key 검증"}
                  </Button>
                  {apiMessage && (
                    <p className={`text-sm ${apiKeyValid ? "text-green-600" : "text-destructive"}`}>
                      {apiMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep.id === "template" && (
          <div className="grid gap-4">
            {!recommendedTemplates.length && (
              <p className="text-sm text-muted-foreground">추천 템플릿을 찾지 못했습니다. Studio에서 직접 작성하세요.</p>
            )}
            {recommendedTemplates.map((template) => (
              <button
                key={template.id}
                className={`rounded-lg border p-4 text-left transition ${template.id === selectedTemplateId ? "border-primary bg-primary/5" : "hover:border-foreground"}`}
                onClick={() => void handleTemplateSelect(template)}
              >
                <p className="font-semibold">{template.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                  {template.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
            {selectedTemplate && (
              <div className="space-y-2">
                <Label>선택한 템플릿 미리보기</Label>
                <Textarea value={selectedTemplate.content} readOnly className="min-h-40" />
              </div>
            )}
          </div>
        )}

        {currentStep.id === "summary" && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">목적:</span> {selectedPurpose?.label ?? "-"}
            </p>
            <p>
              <span className="font-semibold">대상:</span> {audienceId ?? "-"}
            </p>
            <p>
              <span className="font-semibold">모델:</span> {selectedModel?.label ?? "-"}
            </p>
            <p>
              <span className="font-semibold">호스팅:</span> {selectedHosting.label}
            </p>
            <p>
              <span className="font-semibold">템플릿:</span> {selectedTemplate?.title ?? "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              완료 시 프로젝트가 생성되고 Vercel Deploy Hook이 호출됩니다.
            </p>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={goPrev} disabled={stepIndex === 0}>
            이전
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={stepIndex === STEPS.length - 1}>
              다음
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleComplete()} disabled={!canComplete || deploying}>
              {deploying ? "배포 트리거 중..." : "완료 → 자동 배포"}
            </Button>
          )}
          {saving && <span className="text-xs text-muted-foreground">자동 저장 중...</span>}
          {statusMessage && <span className="text-xs text-green-600">{statusMessage}</span>}
          {errorMessage && <span className="text-xs text-destructive">{errorMessage}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

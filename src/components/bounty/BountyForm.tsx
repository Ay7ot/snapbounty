"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  DollarSign,
  Target,
  Eye,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApprovalFlow } from "@/components/tx/ApprovalFlow";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { useCreateBounty } from "@/hooks/useContract";
import { useToastActions } from "@/components/ui/Toast";
import { siteConfig } from "@/config/site";
import { getOrCreateUser } from "@/lib/actions/users";
import { createBountyRecord } from "@/lib/actions/bounties";
import { WalletConnectPrompt } from "@/components/ui/WalletConnectPrompt";
import { cn } from "@/lib/utils";
import type { Category, Difficulty } from "@/config/site";

interface BountyFormData {
  title: string;
  description: string;
  category: Category | "";
  difficulty: Difficulty | "";
  reward: string;
  deadline: string;
  acceptanceCriteria: string;
  tags: string;
}

const initialFormData: BountyFormData = {
  title: "",
  description: "",
  category: "",
  difficulty: "",
  reward: "",
  deadline: "",
  acceptanceCriteria: "",
  tags: "",
};

interface BountyFormProps {
  onSuccess?: (bountyId: string) => void;
}

// Step definitions
const steps = [
  { id: 1, name: "Basics", icon: FileText, description: "Title & description" },
  { id: 2, name: "Category", icon: Layers, description: "Type & difficulty" },
  { id: 3, name: "Reward", icon: DollarSign, description: "Payment & deadline" },
  { id: 4, name: "Criteria", icon: Target, description: "Acceptance requirements" },
  { id: 5, name: "Review", icon: Eye, description: "Confirm details" },
];

export function BountyForm({ onSuccess }: BountyFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const toast = useToastActions();
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<BountyFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof BountyFormData, string>>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedMetadata, setHasSavedMetadata] = useState(false);

  const {
    createBounty,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    receipt,
    createdBountyId,
    reset,
  } = useCreateBounty();

  const categoryOptions = siteConfig.categories.map((cat) => ({
    value: cat.id,
    label: cat.label,
  }));

  const difficultyOptions = siteConfig.difficulties.map((diff) => ({
    value: diff.id,
    label: diff.label,
  }));

  // Scroll to top of form container when step changes
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleChange = useCallback(
    (field: keyof BountyFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Validate current step
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Partial<Record<keyof BountyFormData, string>> = {};

      switch (step) {
        case 1:
          if (!formData.title.trim()) {
            newErrors.title = "Title is required";
          } else if (formData.title.length < 10) {
            newErrors.title = "Title must be at least 10 characters";
          }
          if (!formData.description.trim()) {
            newErrors.description = "Description is required";
          } else if (formData.description.length < 50) {
            newErrors.description = "Description must be at least 50 characters";
          }
          break;
        case 2:
          if (!formData.category) {
            newErrors.category = "Category is required";
          }
          if (!formData.difficulty) {
            newErrors.difficulty = "Difficulty is required";
          }
          break;
        case 3:
          const reward = parseFloat(formData.reward);
          if (!formData.reward || isNaN(reward)) {
            newErrors.reward = "Reward is required";
          } else if (reward < siteConfig.minBountyReward) {
            newErrors.reward = `Minimum reward is $${siteConfig.minBountyReward}`;
          } else if (reward > siteConfig.maxBountyReward) {
            newErrors.reward = `Maximum reward is $${siteConfig.maxBountyReward}`;
          }
          if (formData.deadline) {
            const deadlineDate = new Date(formData.deadline);
            if (deadlineDate <= new Date()) {
              newErrors.deadline = "Deadline must be in the future";
            }
          }
          break;
        case 4:
          if (!formData.acceptanceCriteria.trim()) {
            newErrors.acceptanceCriteria = "Acceptance criteria is required";
          }
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      scrollToTop();
    }
  }, [currentStep, validateStep, scrollToTop]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    scrollToTop();
  }, [scrollToTop]);

  const goToStep = useCallback(
    (step: number) => {
      // Only allow going back, or to already visited steps
      if (step < currentStep) {
        setCurrentStep(step);
        scrollToTop();
      }
    },
    [currentStep, scrollToTop]
  );

  const handleCreateBounty = useCallback(async () => {
    const reward = parseFloat(formData.reward);
    const deadline = formData.deadline
      ? Math.floor(new Date(formData.deadline).getTime() / 1000)
      : 0;

    await createBounty(reward, deadline);
  }, [formData.reward, formData.deadline, createBounty]);

  // Save metadata to Supabase after successful contract creation
  const saveMetadata = useCallback(async () => {
    if ((!receipt && !createdBountyId) || !address) return;

    try {
      const user = await getOrCreateUser(address);

      if (!user) {
        throw new Error("Failed to get or create user");
      }

      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const bounty = await createBountyRecord({
        creatorId: user.id,
        contractBountyId: createdBountyId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        reward: parseFloat(formData.reward),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        acceptanceCriteria: formData.acceptanceCriteria,
        tags,
      });

      if (!bounty) {
        throw new Error("Failed to create bounty record");
      }

      toast.success("Bounty created successfully!", "Your bounty is now live");
      onSuccess?.(bounty.id);
      router.push(`/bounty/${bounty.id}`);
    } catch (err) {
      console.error("Failed to save bounty metadata:", err);
      toast.error(
        "Failed to save bounty details",
        "The bounty was created on-chain. Please check the explore page."
      );
      setIsSubmitting(false);
      setHasSavedMetadata(false);
      reset();
    }
  }, [receipt, createdBountyId, address, formData, toast, onSuccess, router, reset]);

  // Trigger saveMetadata when transaction is successful
  useEffect(() => {
    if (isSuccess && (receipt || createdBountyId) && isSubmitting && !hasSavedMetadata) {
      setHasSavedMetadata(true);
      saveMetadata();
    }
  }, [isSuccess, receipt, createdBountyId, isSubmitting, hasSavedMetadata, saveMetadata]);

  if (!isConnected) {
    return (
      <WalletConnectPrompt
        title="Connect Your Wallet"
        description="You need to connect your wallet to create a bounty."
      />
    );
  }

  // Saving state
  if (isSubmitting && hasSavedMetadata) {
    return (
      <div className="flex flex-col items-center justify-center py-16" ref={containerRef}>
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-accent-green animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-accent-green/30 animate-ping" />
        </div>
        <h3 className="mt-6 text-xl font-semibold text-text-primary">Creating your bounty...</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Transaction confirmed! Saving bounty details...
        </p>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                What do you need help with?
              </h2>
              <p className="text-sm text-text-secondary">
                Give your bounty a clear, descriptive title and explain the task in detail.
              </p>
            </div>

            <Input
              label="Bounty Title"
              placeholder="E.g., Fix authentication bug in React dashboard"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              error={errors.title}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe the task in detail. Include:&#10;• What's the current behavior?&#10;• What's the expected behavior?&#10;• Any relevant context or links"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              error={errors.description}
              hint={`${formData.description.length}/50 minimum characters`}
              rows={6}
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Categorize your bounty
              </h2>
              <p className="text-sm text-text-secondary">
                Help hunters find your bounty by selecting the right category and difficulty level.
              </p>
            </div>

            <div className="grid gap-6">
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(value) => handleChange("category", value)}
                placeholder="What type of work is this?"
                error={errors.category}
              />

              <Select
                label="Difficulty Level"
                options={difficultyOptions}
                value={formData.difficulty}
                onChange={(value) => handleChange("difficulty", value)}
                placeholder="How complex is this task?"
                error={errors.difficulty}
              />

              <Input
                label="Tags (Optional)"
                placeholder="react, typescript, bug-fix (comma separated)"
                value={formData.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                hint="Add tags to help hunters find your bounty"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Set your reward</h2>
              <p className="text-sm text-text-secondary">
                How much are you willing to pay for this task? Funds will be locked in escrow.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-linear-to-br from-accent-green/5 to-accent-purple/5 border border-border-default">
              <label className="block text-sm font-medium text-text-primary mb-3">
                Reward Amount (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent-green">
                  $
                </span>
                <input
                  type="number"
                  min={siteConfig.minBountyReward}
                  max={siteConfig.maxBountyReward}
                  step="1"
                  placeholder="100"
                  value={formData.reward}
                  onChange={(e) => handleChange("reward", e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-4 text-3xl font-bold bg-bg-elevated border rounded-xl",
                    "text-text-primary placeholder:text-text-tertiary",
                    "focus:outline-none focus:ring-2 focus:ring-accent-green/50",
                    "transition-all duration-200",
                    errors.reward ? "border-accent-red" : "border-border-default"
                  )}
                />
              </div>
              {errors.reward && (
                <p className="mt-2 text-sm text-accent-red">{errors.reward}</p>
              )}
              <p className="mt-3 text-xs text-text-tertiary">
                Min: ${siteConfig.minBountyReward} • Max: ${siteConfig.maxBountyReward} •{" "}
                {siteConfig.platformFee * 100}% platform fee on completion
              </p>
            </div>

            <DateTimePicker
              label="Deadline (Optional)"
              value={formData.deadline}
              onChange={(value) => handleChange("deadline", value)}
              error={errors.deadline}
              placeholder="When should this be completed?"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Define acceptance criteria
              </h2>
              <p className="text-sm text-text-secondary">
                Clearly specify what the hunter needs to deliver for you to approve and pay out.
              </p>
            </div>

            <Textarea
              label="Acceptance Criteria"
              placeholder="List specific requirements, for example:&#10;✓ The bug is fixed and tests pass&#10;✓ Code follows project style guide&#10;✓ PR includes documentation updates&#10;✓ Works on Chrome, Firefox, and Safari"
              value={formData.acceptanceCriteria}
              onChange={(e) => handleChange("acceptanceCriteria", e.target.value)}
              error={errors.acceptanceCriteria}
              rows={8}
              required
            />

            <div className="p-4 rounded-lg bg-bg-secondary border border-border-default">
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-text-primary">💡 Tip:</span> Clear acceptance
                criteria help avoid disputes. Be specific about what "done" looks like.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Review your bounty</h2>
              <p className="text-sm text-text-secondary">
                Make sure everything looks correct before submitting.
              </p>
            </div>

            {/* Review Card */}
            <div className="rounded-xl border border-border-default overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-linear-to-r from-bg-elevated to-bg-tertiary">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-text-primary wrap-break-word">
                      {formData.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent-blue/20 text-accent-blue">
                        {categoryOptions.find((c) => c.value === formData.category)?.label}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent-purple/20 text-accent-purple">
                        {difficultyOptions.find((d) => d.value === formData.difficulty)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold text-accent-green">${formData.reward}</p>
                    <p className="text-xs text-text-tertiary mt-1">USDC</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4 bg-bg-secondary/50">
                <div>
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {formData.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                    Acceptance Criteria
                  </p>
                  <div className="p-3 rounded-lg bg-bg-elevated border border-border-default">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                      {formData.acceptanceCriteria}
                    </p>
                  </div>
                </div>

                {formData.deadline && (
                  <div>
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                      Deadline
                    </p>
                    <p className="text-sm text-text-primary">
                      {new Date(formData.deadline).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {formData.tags && (
                  <div>
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(",").map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-bg-elevated text-text-secondary"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="p-6 rounded-xl bg-bg-secondary border border-border-default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-accent-green" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Lock ${formData.reward} USDC</p>
                  <p className="text-xs text-text-secondary">
                    Funds held in escrow until you approve work
                  </p>
                </div>
              </div>

              <ApprovalFlow
                requiredAmount={parseFloat(formData.reward) || 0}
                onAction={() => {
                  setIsSubmitting(true);
                  handleCreateBounty();
                }}
                actionLabel="Create Bounty"
                actionIsPending={isPending}
                actionIsConfirming={isConfirming}
                actionIsSuccess={isSuccess}
                actionError={error}
                actionHash={hash}
                actionReset={reset}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-default">
          <div
            className="h-full bg-accent-green transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                disabled={step.id > currentStep}
                className={cn(
                  "flex flex-col items-center gap-2 group",
                  step.id > currentStep ? "cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2",
                    isCompleted
                      ? "bg-accent-green border-accent-green text-bg-primary"
                      : isActive
                        ? "bg-bg-elevated border-accent-green text-accent-green"
                        : "bg-bg-secondary border-border-default text-text-tertiary"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="hidden sm:block text-center">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isActive ? "text-text-primary" : "text-text-tertiary"
                    )}
                  >
                    {step.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStepContent()}</div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between pt-6 border-t border-border-default">
          <Button
            variant="ghost"
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className={cn(currentStep === 1 && "invisible")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button onClick={goToNextStep} size="lg">
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Back button on review step */}
      {currentStep === 5 && (
        <Button variant="ghost" onClick={goToPrevStep} className="w-full">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Go back and edit
        </Button>
      )}
    </div>
  );
}

export default BountyForm;

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AlertCircle, DollarSign, Calendar, Tag, FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ApprovalFlow } from "@/components/tx/ApprovalFlow";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { useCreateBounty, useUsdcBalance } from "@/hooks/useContract";
import { useToastActions } from "@/components/ui/Toast";
import { siteConfig } from "@/config/site";
import { getOrCreateUser } from "@/lib/actions/users";
import { createBountyRecord } from "@/lib/actions/bounties";
import { WalletConnectPrompt } from "@/components/ui/WalletConnectPrompt";
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

export function BountyForm({ onSuccess }: BountyFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { formattedBalance } = useUsdcBalance(address);
  const toast = useToastActions();

  const [formData, setFormData] = useState<BountyFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof BountyFormData, string>>>({});
  const [step, setStep] = useState<"form" | "review" | "submit" | "saving">("form");
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

  const handleChange = useCallback(
    (field: keyof BountyFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when field is edited
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BountyFormData, string>> = {};

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

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.difficulty) {
      newErrors.difficulty = "Difficulty is required";
    }

    const reward = parseFloat(formData.reward);
    if (!formData.reward || isNaN(reward)) {
      newErrors.reward = "Reward is required";
    } else if (reward < siteConfig.minBountyReward) {
      newErrors.reward = `Minimum reward is $${siteConfig.minBountyReward}`;
    } else if (reward > siteConfig.maxBountyReward) {
      newErrors.reward = `Maximum reward is $${siteConfig.maxBountyReward}`;
    }

    if (!formData.acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = "Acceptance criteria is required";
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmitForm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        setStep("review");
      }
    },
    [validate]
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
      // Use server action to get or create user (bypasses RLS)
      const user = await getOrCreateUser(address);

      if (!user) {
        throw new Error("Failed to get or create user");
      }

      // Parse tags
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Create bounty using server action (bypasses RLS)
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
      toast.error("Failed to save bounty details", "The bounty was created on-chain. Please check the explore page.");
      // Reset to allow viewing the form, but bounty IS created on-chain
      setStep("form");
      setHasSavedMetadata(false);
      reset();
    }
  }, [receipt, createdBountyId, address, formData, toast, onSuccess, router, reset]);

  // Trigger saveMetadata when transaction is successful
  useEffect(() => {
    if (isSuccess && (receipt || createdBountyId) && step === "submit" && !hasSavedMetadata) {
      setHasSavedMetadata(true);
      setStep("saving");
      saveMetadata();
    }
  }, [isSuccess, receipt, createdBountyId, step, hasSavedMetadata, saveMetadata]);

  if (!isConnected) {
    return (
      <WalletConnectPrompt
        title="Connect Your Wallet"
        description="You need to connect your wallet to create a bounty."
      />
    );
  }

  if (step === "saving") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creating Bounty...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4" />
            <p className="text-text-secondary">Saving bounty details...</p>
            <p className="text-sm text-text-tertiary mt-2">
              Your transaction was successful. Please wait while we save your bounty.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "review") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Your Bounty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Review Summary */}
          <div className="rounded-xl border border-border-default bg-bg-secondary/50 overflow-hidden">
            <div className="p-6 border-b border-border-default">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Bounty Details</p>
              <h3 className="text-xl font-bold text-text-primary mb-2">{formData.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{formData.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border-default">
              <div className="bg-bg-secondary/50 p-4">
                <p className="text-xs text-text-tertiary mb-1">Category</p>
                <p className="text-sm font-medium text-text-primary">
                  {categoryOptions.find((c) => c.value === formData.category)?.label}
                </p>
              </div>
              <div className="bg-bg-secondary/50 p-4">
                <p className="text-xs text-text-tertiary mb-1">Difficulty</p>
                <p className="text-sm font-medium text-text-primary">
                  {difficultyOptions.find((d) => d.value === formData.difficulty)?.label}
                </p>
              </div>
              <div className="bg-bg-secondary/50 p-4">
                <p className="text-xs text-text-tertiary mb-1">Reward</p>
                <p className="text-lg font-bold text-accent-green">${formData.reward}</p>
              </div>
              <div className="bg-bg-secondary/50 p-4">
                <p className="text-xs text-text-tertiary mb-1">Deadline</p>
                <p className="text-sm font-medium text-text-primary">
                  {formData.deadline ? new Date(formData.deadline).toLocaleDateString() : "No deadline"}
                </p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Acceptance Criteria</p>
              <div className="p-4 rounded-lg bg-bg-elevated border border-border-default">
                <p className="text-text-secondary whitespace-pre-wrap font-mono text-xs">
                  {formData.acceptanceCriteria}
                </p>
              </div>
            </div>
          </div>

          {/* Platform Fee Notice */}
          <div className="p-4 rounded-lg bg-bg-secondary border border-border-default">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Platform fee:</span>{" "}
              {siteConfig.platformFee * 100}% will be deducted from the reward when the bounty is
              completed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep("form")} className="flex-1">
              Edit
            </Button>
            <Button onClick={() => setStep("submit")} className="flex-1">
              Continue to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "submit") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Bounty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-accent-green mb-2">${formData.reward}</p>
            <p className="text-sm text-text-secondary">USDC will be locked in escrow</p>
          </div>

          <ApprovalFlow
            requiredAmount={parseFloat(formData.reward)}
            onAction={handleCreateBounty}
            actionLabel="Create Bounty"
            actionIsPending={isPending}
            actionIsConfirming={isConfirming}
            actionIsSuccess={isSuccess}
            actionError={error}
            actionHash={hash}
            actionReset={reset}
          />

          <Button
            variant="ghost"
            onClick={() => {
              reset(); // Clear any transaction errors
              setStep("review");
            }}
            className="w-full"
          >
            Back to Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Bounty</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Title */}
          <Input
            label="Title"
            placeholder="E.g., Fix React state bug in dashboard component"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            error={errors.title}
            required
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Describe the task in detail. Include context, current behavior, expected behavior, and any relevant links."
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            error={errors.description}
            hint="Minimum 50 characters"
            required
          />

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(value) => handleChange("category", value)}
              placeholder="Select category"
              error={errors.category}
            />
            <Select
              label="Difficulty"
              options={difficultyOptions}
              value={formData.difficulty}
              onChange={(value) => handleChange("difficulty", value)}
              placeholder="Select difficulty"
              error={errors.difficulty}
            />
          </div>

          {/* Reward & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Reward (USDC)"
                type="number"
                min={siteConfig.minBountyReward}
                max={siteConfig.maxBountyReward}
                step="1"
                placeholder="100"
                value={formData.reward}
                onChange={(e) => handleChange("reward", e.target.value)}
                error={errors.reward}
                required
              />
              <DollarSign className="absolute right-3 top-9 h-4 w-4 text-text-tertiary" />
            </div>
            <div className="relative">
              <DateTimePicker
                label="Deadline (Optional)"
                value={formData.deadline}
                onChange={(value) => handleChange("deadline", value)}
                error={errors.deadline}
                placeholder="Select deadline"
              />
            </div>
          </div>

          {/* Balance Display */}
          <p className="text-xs text-text-tertiary">
            Your USDC balance: <span className="text-text-secondary">${formattedBalance}</span>
          </p>

          {/* Acceptance Criteria */}
          <Textarea
            label="Acceptance Criteria"
            placeholder="List the specific requirements for the bounty to be considered complete. Be clear and specific."
            value={formData.acceptanceCriteria}
            onChange={(e) => handleChange("acceptanceCriteria", e.target.value)}
            error={errors.acceptanceCriteria}
            required
          />

          {/* Tags */}
          <Input
            label="Tags (Optional)"
            placeholder="react, typescript, bug-fix (comma separated)"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
          />

          <Button type="submit" className="w-full" size="lg">
            Review Bounty
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default BountyForm;



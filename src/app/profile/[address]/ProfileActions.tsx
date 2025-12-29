"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Copy, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToastActions } from "@/components/ui/Toast";
import { updateUserProfile } from "@/lib/actions/users";
import { useUser } from "@/hooks/useUser";

interface ProfileActionsProps {
  address: string;
}

export function ProfileActions({ address }: ProfileActionsProps) {
  const { address: connectedAddress } = useAccount();
  const { user, updateUser } = useUser();
  const toast = useToastActions();

  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });

  const isOwnProfile = connectedAddress?.toLowerCase() === address.toLowerCase();

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateProfile = async () => {
    if (!connectedAddress) return;

    setIsUpdating(true);
    try {
      const updated = await updateUserProfile(connectedAddress, {
        username: formData.username || undefined,
        bio: formData.bio || undefined,
      });

      if (updated) {
        updateUser({
          username: formData.username,
          bio: formData.bio,
        });
        toast.success("Profile updated!");
        setShowEditModal(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("Error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={copyAddress}>
          {copied ? (
            <Check className="h-4 w-4 text-accent-green" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        {isOwnProfile && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormData({
                username: user?.username || "",
                bio: user?.bio || "",
              });
              setShowEditModal(true);
            }}
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            label="Username"
            placeholder="Enter a username"
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, username: e.target.value }))
            }
          />
          <Textarea
            label="Bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bio: e.target.value }))
            }
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} isLoading={isUpdating}>
              Save Changes
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </>
  );
}



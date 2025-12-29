import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BountyCardCompact } from "@/components/bounty";
import { getUserProfile, getUserCompletedBounties } from "@/lib/actions/users";
import {
  User,
  Star,
  CheckCircle2,
  DollarSign,
  Calendar,
  ExternalLink,
  Copy,
} from "lucide-react";
import { ProfileActions } from "./ProfileActions";

interface ProfilePageProps {
  params: Promise<{
    address: string;
  }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { address } = await params;
  const user = await getUserProfile(address);

  if (!user) {
    return {
      title: "User Not Found",
    };
  }

  return {
    title: user.username || `${address.slice(0, 6)}...${address.slice(-4)}`,
    description: user.bio || "SnapBounty user profile",
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params;
  const user = await getUserProfile(address);

  if (!user) {
    notFound();
  }

  const completedBounties = await getUserCompletedBounties(address);

  // Format wallet address for display
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Format join date
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-text-tertiary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-text-primary">
                        {user.username || shortAddress}
                      </h1>
                      <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                        <span className="font-mono">{shortAddress}</span>
                        <a
                          href={`https://basescan.org/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-accent-green"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <ProfileActions address={address} />
                  </div>

                  {user.bio && (
                    <p className="mt-4 text-text-secondary">{user.bio}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {joinDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border-default">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-accent-green">
                    <Star className="h-5 w-5" />
                    <span className="text-2xl font-bold">{user.reputation}</span>
                  </div>
                  <p className="text-sm text-text-tertiary mt-1">Reputation</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-accent-purple">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-2xl font-bold">
                      {user.completedBounties}
                    </span>
                  </div>
                  <p className="text-sm text-text-tertiary mt-1">Completed</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-accent-green">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-2xl font-bold">
                      ${user.totalEarned.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-sm text-text-tertiary mt-1">Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Bounties */}
          <Card>
            <CardHeader>
              <CardTitle>Completed Bounties</CardTitle>
            </CardHeader>
            <CardContent>
              {completedBounties.length > 0 ? (
                <div className="space-y-3">
                  {completedBounties.map((bounty) => (
                    <BountyCardCompact key={bounty.id} bounty={bounty} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary">No completed bounties yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}



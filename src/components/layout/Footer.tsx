import Link from "next/link";
import { Twitter, Github, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

const footerLinks = {
  product: [
    { href: "/explore", label: "Explore Bounties" },
    { href: "/create", label: "Post a Bounty" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
  resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/faq", label: "FAQ" },
    { href: "/support", label: "Support" },
  ],
  legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

const socialLinks = [
  { href: siteConfig.links.twitter, icon: Twitter, label: "Twitter" },
  { href: siteConfig.links.github, icon: Github, label: "GitHub" },
  { href: siteConfig.links.discord, icon: MessageCircle, label: "Discord" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-secondary">
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-xl font-bold text-text-primary"
            >
              <span className="text-gradient-green">Snap</span>Bounty
            </Link>
            <p className="mt-4 text-sm text-text-secondary max-w-xs">
              A lightweight marketplace for small tasks and fast rewards.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-tertiary hover:text-accent-green transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border-default">
          <p className="text-center text-sm text-text-tertiary">
            © {new Date().getFullYear()} SnapBounty. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}







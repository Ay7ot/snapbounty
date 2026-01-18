import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = siteConfig.url;

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/explore`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/create`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/testnet`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];

    // TODO: In production, you can dynamically fetch bounties from the database
    // and add them to the sitemap for better SEO
    // 
    // Example:
    // const bounties = await getBounties({ status: 'open' });
    // const bountyPages = bounties.map((bounty) => ({
    //   url: `${baseUrl}/bounty/${bounty.id}`,
    //   lastModified: new Date(bounty.updatedAt),
    //   changeFrequency: 'daily' as const,
    //   priority: 0.6,
    // }));

    return [...staticPages];
}

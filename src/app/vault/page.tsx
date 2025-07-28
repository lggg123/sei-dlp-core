import { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  // Extract custom parameters for dynamic OG images
  const title = typeof searchParams.title === 'string' ? searchParams.title : 'SEI DLP Vault';
  const vault = typeof searchParams.vault === 'string' ? searchParams.vault : 'Dynamic Vault';
  const apy = typeof searchParams.apy === 'string' ? searchParams.apy : '0.00';
  
  const ogUrl = new URL('/api/og', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  ogUrl.searchParams.set('title', title);
  ogUrl.searchParams.set('subtitle', `${vault} • ${apy}% APY`);
  ogUrl.searchParams.set('description', 'Optimized liquidity positions with AI-driven rebalancing on SEI Network');

  return {
    title: `${title} | SEI DLP`,
    description: `${vault} with ${apy}% APY - AI-optimized liquidity on SEI Network`,
    openGraph: {
      title: `${title} | SEI DLP`,
      description: `${vault} with ${apy}% APY - AI-optimized liquidity on SEI Network`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${title} - SEI DLP Vault`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | SEI DLP`,
      description: `${vault} with ${apy}% APY - AI-optimized liquidity on SEI Network`,
      images: [ogUrl.toString()],
    },
  };
}

export default function VaultPage({ params, searchParams }: PageProps) {
  const title = typeof searchParams.title === 'string' ? searchParams.title : 'SEI DLP Vault';
  const vault = typeof searchParams.vault === 'string' ? searchParams.vault : 'Dynamic Vault';
  const apy = typeof searchParams.apy === 'string' ? searchParams.apy : '0.00';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6 holo-text">{title}</h1>
        
        <div className="glass-card p-8 mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-primary">{vault}</h2>
          <div className="text-5xl font-bold text-cyan-glow mb-4">{apy}% APY</div>
          <p className="text-xl text-muted-foreground">
            AI-optimized liquidity positions with automatic rebalancing on SEI Network
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-primary-glow mb-2">400ms</div>
            <div className="text-muted-foreground">Finality</div>
          </div>
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-cyan-glow mb-2">~$0.15</div>
            <div className="text-muted-foreground">Gas Cost</div>
          </div>
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-purple-glow mb-2">713715</div>
            <div className="text-muted-foreground">Chain ID</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-secondary">Test Different Open Graph Previews:</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="?title=SEI-USDC%20Pool&vault=Concentrated%20Liquidity&apy=127.5"
              className="btn-cyber"
            >
              SEI-USDC Pool
            </a>
            <a 
              href="?title=ETH-USDT%20Vault&vault=Dynamic%20Range&apy=89.2"
              className="btn-cyber"
            >
              ETH-USDT Vault
            </a>
            <a 
              href="?title=BTC-SEI%20Strategy&vault=AI%20Optimized&apy=156.7"
              className="btn-cyber"
            >
              BTC-SEI Strategy
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Each link above generates a unique Open Graph image with custom vault data.<br/>
            Share these links on social media to see different preview images!
          </p>
        </div>
      </div>
    </div>
  );
}

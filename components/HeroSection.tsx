export default function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8 sm:p-12 mb-10">
      <div className="relative z-10 flex flex-col items-start max-w-2xl space-y-4">
        <h2 className="font-brand text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Build AI workflows in seconds
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Create powerful, automated content generation pipelines by connecting different AI models together. No coding required.
        </p>
        <button className="mt-4 rounded-[18px] bg-[#E42024] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#C11B1E] transition-colors">
          Start Building Free
        </button>
      </div>
      
      {/* Decorative background blur */}
      <div className="pointer-events-none absolute -bottom-1/2 -right-1/4 h-full w-full opacity-30 blur-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 motion-safe:animate-pulse"></div>
      </div>
    </div>
  );
}

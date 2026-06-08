export default function TopBanner() {
  return (
    <div className="fixed top-0 z-50 flex h-14 w-full items-center justify-center bg-[#E42024] text-white shadow-lg">
      <p className="text-sm font-medium">
        Pay once, get a LIFETIME deal forever — for only $399
      </p>
      <div className="ml-4 flex items-center gap-2">
        <span className="text-sm font-bold">11h 45m 35s</span>
        <button className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#E42024] hover:bg-gray-100 transition-colors">
          Click here
        </button>
      </div>
    </div>
  );
}

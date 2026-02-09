import { streamUrl } from "../api";

interface Props {
  running: boolean;
  streamKey: number;
}

export default function VideoFeed({ running, streamKey }: Props) {
  return (
    <div className="relative flex-1 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
      {running ? (
        <img
          src={streamUrl(streamKey)}
          alt="Live detection feed"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="text-gray-600 text-lg select-none">
          Click <span className="text-accent font-semibold">Start</span> to begin detection
        </div>
      )}
    </div>
  );
}

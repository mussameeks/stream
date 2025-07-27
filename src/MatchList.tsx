import React, { useEffect, useState } from 'react';

// Define type for match
type Match = {
  id: string;
  title: string;
  date: number;
  poster?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeBadge?: string;
  awayBadge?: string;
  firstStreamEmbedUrl?: string | null;
  type?: 'live' | 'upcoming' | 'popular' | 'all';
  popular?: boolean;
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'popular', label: 'Popular' },
];

const MatchCard: React.FC<{ match: Match }> = ({ match }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 mb-4 w-full">
    <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
      <span className="font-semibold">{match.title}</span>
      <span>⋮</span>
    </div>
    <div className="flex items-center justify-center gap-2 mb-2">
      {match.homeBadge && (
        <img
          src={`https://streamed.su/api/images/badge/${match.homeBadge}.webp`}
          alt={match.homeTeam}
          className="w-8 h-8 rounded-full"
        />
      )}
      <span>{match.homeTeam}</span>
      <span className="text-gray-400 font-bold px-2">VS</span>
      <span>{match.awayTeam}</span>
      {match.awayBadge && (
        <img
          src={`https://streamed.su/api/images/badge/${match.awayBadge}.webp`}
          alt={match.awayTeam}
          className="w-8 h-8 rounded-full"
        />
      )}
    </div>
    <div className="text-sm text-gray-600 mb-2">
      🕒 {new Date(match.date).toLocaleString()}
    </div>
    {match.poster && match.homeBadge && match.awayBadge && (
      <img
        src={`https://streamed.su/api/images/poster/${match.homeBadge}/${match.awayBadge}.webp`}
        alt={match.title}
        className="w-full rounded-lg mb-2"
      />
    )}
    {match.firstStreamEmbedUrl ? (
      <a
        href={match.firstStreamEmbedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-blue-600 text-white font-medium rounded-xl py-2 hover:bg-blue-700 transition"
      >
        🔗 Watch Now
      </a>
    ) : (
      <span className="block text-center text-gray-400">No Stream</span>
    )}
  </div>
);

const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError('');
      try {
        // Determine API URL based on filter
        let url = 'https://streamed.su/api/matches/football';
        if (filter === 'live') url = 'https://streamed.su/api/matches/live';
        if (filter === 'popular')
          url = 'https://streamed.su/api/matches/football/popular';

        const response = await fetch(url);
        const data = await response.json();

        const now = Date.now();

        const mapped = await Promise.all(
          data.map(async (match: any) => {
            let firstStreamEmbedUrl = null;
            if (match.sources && match.sources[0]) {
              try {
                const s = match.sources[0];
                const streamRes = await fetch(
                  `https://streamed.su/api/stream/${s.source}/${s.id}`
                );
                const streams = await streamRes.json();
                firstStreamEmbedUrl =
                  streams?.embedUrl || streams[0]?.embedUrl || null;
              } catch {
                // ignore stream fetch errors
              }
            }
            // Determine match type for filtering
            let type: Match['type'] = 'all';
            if (filter === 'live' || url.includes('live')) type = 'live';
            else if (match.date && match.date > now) type = 'upcoming';
            else if (match.popular) type = 'popular';

            return {
              id: match.id,
              title: match.title,
              date: match.date,
              poster: match.poster,
              homeTeam: match.teams?.home?.name,
              awayTeam: match.teams?.away?.name,
              homeBadge: match.teams?.home?.badge,
              awayBadge: match.teams?.away?.badge,
              firstStreamEmbedUrl,
              type,
              popular: match.popular,
            };
          })
        );

        // For 'upcoming', filter after mapping
        let filtered = mapped;
        if (filter === 'upcoming') {
          filtered = mapped.filter((m) => m.date && m.date > Date.now());
        }

        setMatches(filtered);
      } catch (err) {
        setError('Failed to load matches.');
      }
      setLoading(false);
    };
    fetchMatches();
  }, [filter]);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="p-2">
      {/* Filter Bar */}
      <div className="flex gap-2 mb-4 justify-center">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`px-4 py-2 rounded-full font-medium transition border ${
              filter === f.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-200'
            }`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {/* Matches */}
      {matches.length === 0 ? (
        <div className="text-center text-gray-400">No matches found.</div>
      ) : (
        matches.map((match) => <MatchCard key={match.id} match={match} />)
      )}
    </div>
  );
};

export default MatchList;

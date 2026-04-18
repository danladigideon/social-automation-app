import { useEffect, useState } from 'react';
import './ScheduledPosts.css';

import supabase from './supabaseClient';

const PLATFORM_ORDER = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];

function parsePlatforms(platforms) {
  // Stored as a CSV string by `NewPost` (e.g. "Instagram, Facebook").
  if (typeof platforms === 'string') {
    return platforms
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (Array.isArray(platforms)) return platforms;
  return [];
}

function formatScheduledAt(scheduledAt) {
  if (!scheduledAt) return '';

  const dateObj = new Date(scheduledAt);
  if (Number.isNaN(dateObj.getTime())) return '';

  const dateStr = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Match existing mock formatting: "Apr 18, 2026 - 10:30 AM"
  return `${dateStr} - ${timeStr}`;
}

function ScheduledPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    console.log('ScheduledPosts mounted');
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('id, caption, platforms, scheduled_at')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      console.log('ScheduledPosts fetchPosts query result:', { data, error });

      if (cancelled) return;

      if (error) {
        // Keep UI simple per requirements; render empty state on errors.
        setPosts([]);
        setLoading(false);
        return;
      }

      setPosts(data ?? []);
      setLoading(false);
    }

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (post) => {
    if (!post?.id) return;

    setDeletingId(post.id);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);

    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    }

    setDeletingId(null);
  };

  return (
    <section className="scheduled-posts" aria-label="Scheduled posts">
      {loading ? <p>Loading scheduled posts...</p> : null}

      {!loading && posts.length === 0 ? (
        <p>No scheduled posts yet.</p>
      ) : null}

      {!loading
        ? posts.map((post) => {
            const platforms = parsePlatforms(post.platforms)
              .filter((p) => PLATFORM_ORDER.includes(p));

            return (
              <article key={post.id} className="scheduled-post-card">
                <div className="scheduled-post-thumb" aria-hidden="true">
                  Thumbnail
                </div>

                <div className="scheduled-post-body">
                  <p className="scheduled-post-caption">
                    {post.caption ?? ''}
                  </p>

                  <div className="scheduled-post-platforms">
                    {platforms.map((platform) => (
                      <span key={platform} className="scheduled-post-badge">
                        {platform}
                      </span>
                    ))}
                  </div>

                  <p className="scheduled-post-time">
                    Scheduled: <span>{formatScheduledAt(post.scheduled_at)}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="scheduled-post-delete"
                  onClick={() => handleDelete(post)}
                  disabled={deletingId === post.id}
                >
                  Delete
                </button>
              </article>
            );
          })
        : null}
    </section>
  );
}

export default ScheduledPosts;

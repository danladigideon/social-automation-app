import { useState } from 'react';
import './NewPost.css';
import supabase from './supabaseClient';

const PLATFORM_ORDER = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];
const CLOUDINARY_CLOUD_NAME = 'dobkppz8y';
const CLOUDINARY_UPLOAD_PRESET = 'social_auto_uploads';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json?.error?.message || `Cloudinary upload failed with status ${res.status}.`;
    throw new Error(message);
  }

  const secureUrl = json?.secure_url;
  if (!secureUrl) throw new Error('Cloudinary upload did not return secure_url.');

  return secureUrl;
}

function buildPlatformsCsv(platforms) {
  return PLATFORM_ORDER.filter((p) => platforms[p]).join(', ');
}

function NewPost() {
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState({
    Instagram: false,
    Facebook: false,
    TikTok: false,
    YouTube: false,
  });
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const togglePlatform = (name) => {
    setPlatforms((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handlePostNow = async () => {
    setShowSchedulePicker(false);
    setFeedback(null);
    setSaving(true);
    try {
      let media_url = '';
      if (selectedFile) {
        setUploading(true);
        media_url = await uploadToCloudinary(selectedFile);
      }

      const platformsCsv = buildPlatformsCsv(platforms);
      const { error } = await supabase.from('posts').insert({
        caption,
        platforms: platformsCsv,
        media_url,
        scheduled_at: new Date().toISOString(),
        status: 'posted',
      });

      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }

      setFeedback({ type: 'success', message: 'Post saved successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to upload and save post.',
      });
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleScheduleClick = () => {
    setShowSchedulePicker(true);
    setFeedback(null);
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleDate.trim() || !scheduleTime.trim()) {
      setFeedback({ type: 'error', message: 'Please select a date and time.' });
      return;
    }
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setFeedback({ type: 'error', message: 'Invalid date or time.' });
      return;
    }
    setFeedback(null);
    setSaving(true);
    try {
      let media_url = '';
      if (selectedFile) {
        setUploading(true);
        media_url = await uploadToCloudinary(selectedFile);
      }

      const platformsCsv = buildPlatformsCsv(platforms);
      const { error } = await supabase.from('posts').insert({
        caption,
        platforms: platformsCsv,
        media_url,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
      });

      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }

      const [y, m, d] = scheduleDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dateStr = dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const [hh, mm] = scheduleTime.split(':').map(Number);
      const timeStr = new Date(1970, 0, 1, hh, mm).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      setFeedback({
        type: 'success',
        message: `Post scheduled for ${dateStr} at ${timeStr}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to upload and schedule post.',
      });
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <section className="new-post-card" aria-label="Create a new post">
      <h2 className="new-post-heading">Create New Post</h2>

      <div className="new-post-field">
        <label className="new-post-label" htmlFor="caption">
          Caption
        </label>
        <textarea
          id="caption"
          className="new-post-textarea"
          placeholder="Write your caption..."
          rows={5}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <div className="new-post-field">
        <label className="new-post-label" htmlFor="media-upload">
          Upload Image or Video
        </label>
        <input
          id="media-upload"
          className="new-post-file"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <fieldset className="new-post-fieldset">
        <legend className="new-post-label">Platforms</legend>
        <label className="new-post-checkbox">
          <input
            type="checkbox"
            checked={platforms.Instagram}
            onChange={() => togglePlatform('Instagram')}
          />
          <span>Instagram</span>
        </label>
        <label className="new-post-checkbox">
          <input
            type="checkbox"
            checked={platforms.Facebook}
            onChange={() => togglePlatform('Facebook')}
          />
          <span>Facebook</span>
        </label>
        <label className="new-post-checkbox">
          <input
            type="checkbox"
            checked={platforms.TikTok}
            onChange={() => togglePlatform('TikTok')}
          />
          <span>TikTok</span>
        </label>
        <label className="new-post-checkbox">
          <input
            type="checkbox"
            checked={platforms.YouTube}
            onChange={() => togglePlatform('YouTube')}
          />
          <span>YouTube</span>
        </label>
      </fieldset>

      {showSchedulePicker && (
        <div className="new-post-schedule-panel" role="region" aria-label="Schedule date and time">
          <div className="new-post-field new-post-field--inline">
            <label className="new-post-label" htmlFor="schedule-date">
              Date
            </label>
            <input
              id="schedule-date"
              className="new-post-input-datetime"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <div className="new-post-field new-post-field--inline">
            <label className="new-post-label" htmlFor="schedule-time">
              Time
            </label>
            <input
              id="schedule-time"
              className="new-post-input-datetime"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="new-post-button new-post-button--confirm"
            onClick={handleConfirmSchedule}
            disabled={saving || uploading}
          >
            Confirm Schedule
          </button>
        </div>
      )}

      {uploading ? (
        <p className="new-post-uploading" role="status" aria-live="polite">
          Uploading...
        </p>
      ) : null}

      {feedback && (
        <p
          className={feedback.type === 'success' ? 'new-post-success' : 'new-post-error'}
          role={feedback.type === 'success' ? 'status' : 'alert'}
        >
          {feedback.message}
        </p>
      )}

      <div className="new-post-actions">
        <button
          type="button"
          className="new-post-button new-post-button--primary"
          onClick={handlePostNow}
          disabled={saving || uploading}
        >
          Post Now
        </button>
        <button
          type="button"
          className="new-post-button new-post-button--secondary"
          onClick={handleScheduleClick}
          disabled={saving || uploading}
        >
          Schedule
        </button>
      </div>
    </section>
  );
}

export default NewPost;

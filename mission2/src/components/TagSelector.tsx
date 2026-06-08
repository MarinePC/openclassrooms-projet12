'use client';

import { useState } from 'react';
import styles from './TagSelector.module.css';
import { ALLOWED_TAGS } from '@/constants/tags.ts';
import { Claim } from '@/database/queries.ts';
import { updateClaimTag, classifyClaim } from '@/api-client.ts';

interface TagSelectorProps {
  claim: Claim | null;
  onTagUpdate: (claimId: number, tag: string) => void;
}

export default function TagSelector({ claim, onTagUpdate }: TagSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [suggestedTag, setSuggestedTag] = useState<string | null>(null);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  const handleTagSelect = async (tag: string) => {
    if (!claim) return;

    setIsUpdating(true);
    setSuggestedTag(null);
    try {
      await updateClaimTag(claim.id, tag);
      onTagUpdate(claim.id, tag);
    } catch (error) {
      console.error('Error updating tag:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoTag = async () => {
    if (!claim) return;

    setIsClassifying(true);
    setSuggestedTag(null);
    setClassifyError(null);
    try {
      const tag = await classifyClaim(claim.content);
      setSuggestedTag(tag);
    } catch (error) {
      console.error('Error classifying claim:', error);
      setClassifyError('Auto-tag unavailable. Please assign manually.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleConfirmSuggestion = async () => {
    if (!claim || !suggestedTag) return;
    await handleTagSelect(suggestedTag);
  };

  if (!claim) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <h3>Select a claim to assign tags</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Claim #{claim.id}</h2>
      </div>

      <div className={styles.content}>
        <div className={styles.claimContent}>
          <h4>Content</h4>
          <p>{claim.content}</p>
        </div>

        <div className={styles.tagSection}>
          <h4>Assign tag</h4>

          <div className={styles.tagSelector}>
            <select
              className={styles.select}
              value={suggestedTag ?? claim.tag ?? ''}
              onChange={(e) => handleTagSelect(e.target.value)}
              disabled={isUpdating || isClassifying}
            >
              <option value="" disabled>
                Select a tag
              </option>

              {ALLOWED_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            {(!claim.tag || claim.tag === '') && !suggestedTag && (
              <svg
                className={styles.chevronIcon}
                width="12"
                height="12"
                viewBox="0 0 292.4 292.4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="var(--foreground-muted)"
                  d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"
                />
              </svg>
            )}

            {isUpdating && (
              <div className={styles.updating}>
                Updating...
              </div>
            )}
          </div>

          <button
            className={styles.autoTagButton}
            onClick={handleAutoTag}
            disabled={isClassifying || isUpdating}
          >
            {isClassifying ? 'Analysing...' : '✦ Auto-tag'}
          </button>

          {classifyError && (
            <p className={styles.errorMessage}>{classifyError}</p>
          )}

          {suggestedTag && (
            <div className={styles.suggestion}>
              <p>Suggested tag: <strong>{suggestedTag}</strong></p>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmSuggestion}
                disabled={isUpdating}
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
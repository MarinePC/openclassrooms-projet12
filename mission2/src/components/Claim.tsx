'use client';

import styles from './Claim.module.css';
import { Claim } from '@/database/queries.ts';

interface ClaimProps {
  claim: Claim;
  isSelected: boolean;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
}

export default function ClaimComponent({ claim, isSelected, onClick, onTagClick }: ClaimProps) {
  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (claim.tag && onTagClick) {
      onTagClick(claim.tag);
    }
  };
  ;
  return (
    <div
      className={`${styles.container} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className={styles.content}>
        <p
          className={styles.text}
          id={`claim-content-${claim.id}`}
        >
          {claim.content}
        </p>
        {claim.tag && (
          <button
            className={styles.tag}
            onClick={handleTagClick}
            aria-label={`Navigate to ${claim.tag} inbox`}
            title={`Go to ${claim.tag} inbox`}
          >
            {claim.tag}
          </button>
        )}
      </div>
    </div>
  );
}
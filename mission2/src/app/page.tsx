'use client';

import { useState } from 'react';
import styles from "./page.module.css";
import Inboxes from '@/components/Inboxes.tsx';
import Inbox from '@/components/Inbox.tsx';
import TagSelector from '@/components/TagSelector.tsx';
import { Claim } from '@/database/queries.ts';
import { fetchClaims } from '@/api-client.ts';
import { useEffect } from 'react';

export default function Home() {
  const [selectedInboxId, setSelectedInboxId] = useState<string>('untagged');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadClaims = async () => {
      setLoading(true);
      try {
        const tagParam = selectedInboxId === 'untagged' ? 'untagged' : selectedInboxId;
        const fetchedClaims = await fetchClaims(tagParam);
        setClaims(fetchedClaims);
      } catch (error) {
        console.error('Error fetching claims:', error);
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };

    loadClaims();
  }, [selectedInboxId]);

  const handleSelectInbox = (inboxId: string) => {
    setSelectedInboxId(inboxId);
    setSelectedClaim(null);
  };

  const handleSelectClaim = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  const handleTagClick = (tag: string) => {
    setSelectedInboxId(tag);
    setSelectedClaim(null);
  };

  const handleTagUpdate = (claimId: number, tag: string) => {
    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim({ ...selectedClaim, tag });
    }
    try {
      const tagParam = selectedInboxId === 'untagged' ? 'untagged' : selectedInboxId;
      fetchClaims(tagParam).then(res => setClaims(res));
    } catch (error) {
      console.error('Error refreshing claims after tag update:', error);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/za-logo.svg"
          alt="ZA Logo"
          className={styles.logo}
        />

        <h1>Claims Management System</h1>
      </header>

      <main id="main-content" className={styles.mainContent}>
        <nav className={styles.sidebar}>
          <Inboxes
            onSelectInbox={handleSelectInbox}
            selectedInboxId={selectedInboxId}
          />
        </nav>

        <section className={styles.contentArea}>
          <Inbox
            inboxId={selectedInboxId}
            onSelectClaim={handleSelectClaim}
            selectedClaimId={selectedClaim?.id}
            claims={claims}
            loading={loading}
            onTagClick={handleTagClick}
          />
        </section>

        <aside className={styles.detailsPanel}>
          <TagSelector
            claim={selectedClaim}
            onTagUpdate={handleTagUpdate}
          />
        </aside>
      </main>
    </div>
  );
}

'use client';

import { ALLOWED_TAGS } from '@/constants/tags';
import styles from './Inboxes.module.css';

interface InboxesProps {
  onSelectInbox: (inboxId: string) => void;
  selectedInboxId?: string;
}

const INBOXES: { id: string, name: string }[] = [
  { id: 'all', name: 'All Claims' },
  { id: 'untagged', name: 'Untagged' },
  ...ALLOWED_TAGS.map((tag) => ({
    id: tag,
    name: tag,
  }))
]


export default function Inboxes({ onSelectInbox, selectedInboxId }: InboxesProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 id="inboxes-heading">Inboxes</h2>
      </div>

      <div
        className={styles.inboxList}
        role="listbox"
        aria-labelledby="inboxes-heading"
      >
        {INBOXES.map((inbox) => (
          <button
            key={inbox.id}
            className={`${styles.inbox} ${selectedInboxId === inbox.id ? styles.selected : ''}`}
            onClick={() => onSelectInbox(inbox.id)}
          >
            <span className={styles.inboxName}>{inbox.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
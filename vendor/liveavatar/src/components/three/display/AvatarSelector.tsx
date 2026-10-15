'use client';

import { FiUser } from 'react-icons/fi';
import { useAvatarStore } from './avatarStore';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from './display.module.css';

export function AvatarSelector() {
  const { t } = useLocale();
  const avatar = useAvatarStore(state => state.avatar);
  const setAvatar = useAvatarStore(state => state.setAvatar);
  return <div className={styles.actions} role="group" aria-label={t('아바타 선택')}>
    <button type="button" aria-pressed={avatar === 'female'} onClick={() => setAvatar('female')}>
      <FiUser size={24} aria-hidden="true"/><span>{t('여자')}</span>
    </button>
    <button type="button" aria-pressed={avatar === 'male'} onClick={() => setAvatar('male')}>
      <FiUser size={24} aria-hidden="true"/><span>{t('남자')}</span>
    </button>
  </div>;
}

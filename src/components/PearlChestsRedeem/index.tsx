import { Divider, Paper, Typography } from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import { LabelChip } from '../Chip';
import { getTokenImage, formatCurrency } from 'src/helpers';
import formatDate from 'date-fns/format';
import differenceInDays from 'date-fns/differenceInDays';
import receiptImage from './receipt.png';
import './styles.scss';
import CustomButton from '../Button/CustomButton';
import { useSelector } from 'src/store/hook';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector as useReduxSelector } from 'react-redux';
import {
  redeem as redeemAction,
  claimReward as claimRewardAction,
  ITerm,
  ILock,
} from 'src/store/slices/pearl-vault-slice';
import { useWeb3Context } from 'src/hooks';
import ActionButton from '../Button/ActionButton';
import { IPendingTxn } from 'src/store/slices/pending-txns-slice';
import { IReduxState } from 'src/store/slices/state.interface';

const numberFormatter = Intl.NumberFormat('en', { maximumFractionDigits: 0 });

export interface Note {
  id: string;
  amount: number;
  currentReward: number;
  nextReward: number;
  lockedValue: number;
  marketValue: number;
  lockupPeriod: number;
  dueDate: Date;
  apy: number;
  locked: boolean;
}

export default function PearlChestsRedeem() {
  const locks = useSelector(state => state.pearlVault.locks);
  const terms = useSelector(state => state.pearlVault.terms);
  const termsMap = useMemo(() => {
    return new Map(terms.map(term => [term.noteAddress, term]));
  }, [terms]);

  return (
    <Paper className="ohm-card">
      {locks.map(lock => {
        const term = termsMap.get(lock.noteAddress)!;
        return (
          <NoteCard
            term={term}
            lock={lock}
            note={{
              id: lock.tokenId.toString(),
              amount: 123,
              currentReward: 10,
              nextReward: 20,
              lockedValue: 42.1,
              marketValue: 5592.12,
              lockupPeriod: term.lockPeriod,
              dueDate: new Date('March, 26, 2022 9:00 AM'),
              apy: 492391,
              locked: true,
            }}
          />
        );
      })}
    </Paper>
  );
}

function NoteCard({ note, term, lock }: { note: Note; term: ITerm; lock: ILock }) {
  const { t } = useTranslation();
  const details = [
    {
      label: 'pearlChests.lockupAmount',
      after: <span className="note__peral-icon">{getTokenImage('pearl', 20)}</span>,
      value: note.amount,
    },
    { label: 'pearlChests.currentReward', value: numberFormatter.format(note.currentReward) + ' PERAL' },
    {
      label: 'pearlChests.nextReward',
      value: numberFormatter.format(note.nextReward) + ' PERAL',
      params: { boost: 2 },
    },
    { label: 'pearlChests.lockedValue', value: numberFormatter.format(note.lockedValue) + ' PERAL' },
    { label: 'pearlChests.marketValue', value: formatCurrency(note.marketValue) },
    {
      label: 'pearlChests.lockupPeriod',
      value: note.lockupPeriod,
      after: <span className="note__countdown">{differenceInDays(note.dueDate, new Date())} days left</span>,
    },
    {
      label: 'pearlChests.dueDate',
      value: formatDate(note.dueDate, 'MMMM, d, Y, hh:mm a (O)'),
    },
    { label: 'pearlChests.apy', value: numberFormatter.format(note.apy) + '%' },
  ];

  const dispatch = useDispatch();
  const { provider, address, chainID } = useWeb3Context();
  const pendingTransactions = useReduxSelector<IReduxState, IPendingTxn[]>(state => {
    return state.pendingTransactions;
  });
  const redeem = useCallback(() => {
    dispatch(
      redeemAction({
        networkID: chainID,
        provider,
        noteAddress: lock.noteAddress,
        tokenId: lock.tokenId,
      }),
    );
  }, [lock]);

  return (
    <div className="note">
      <Typography className="note__title" variant="h3" component="h3">
        Safe-Hand PEARL Note
        <LockStatus locked={note.locked} />
        <span className="note__id">{note.id}</span>
      </Typography>

      <div className="note__body">
        <div className="note__receipt-image">
          <img src={receiptImage} />
        </div>
        <Divider className="note__div" flexItem orientation="vertical" />
        <div className="note__details">
          {details.map(row => (
            <div key={row.label} className="note__details-row">
              <span className="note__details-label">{t(row.label, row.params)}</span>
              <span className="note__details-value">
                {row.value}
                {row.after}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="note__actions">
        {note.locked && (
          <>
            <CustomButton className="note__action" text={t('pearlChests.claimRewardAndRelock')} />
            <CustomButton className="note__action" type="outline" text={t('pearlChests.claimReward')} />
          </>
        )}
        {!note.locked && (
          <>
            <ActionButton
              className="note__action"
              pendingTransactions={pendingTransactions}
              type={'redeem_' + term.noteAddress + '_' + lock.tokenId.toString()}
              start={t('pearlChests.redeemAll')}
              progress="Processing..."
              processTx={redeem}
            />
            <CustomButton className="note__action" type="outline" text={t('pearlChests.claimAllAndRelock')} />
          </>
        )}
      </div>
    </div>
  );
}

function LockStatus({ locked }: { locked?: boolean }) {
  const { t } = useTranslation();
  const label = locked ? t('pearlChests.locked') : t('pearlChests.unlocked');
  const className = locked ? 'note__lock-status' : 'note__lock-status note__lock-status--unlocked';
  return <LabelChip className={className} label={label} />;
}

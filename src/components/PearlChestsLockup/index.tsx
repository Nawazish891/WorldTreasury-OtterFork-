import { Divider, Paper, Typography } from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { formatCurrency, formatApy } from 'src/helpers';
import { useWeb3Context } from 'src/hooks';
import { IPendingTxn } from 'src/store/slices/pending-txns-slice';
import { IPearlVaultSliceState, ITerm, selectTerm as selectTermAction } from 'src/store/slices/pearl-vault-slice';
import { IReduxState } from 'src/store/slices/state.interface';
import ActionButton from '../Button/ActionButton';
import InfoTooltip from '../InfoTooltip/InfoTooltip';
import PearlChestLockupModal from '../PearlChestLockupModal';
import PearlChestLockupSuccessModal from '../PearlChestLockupSuccessModal';
import receiptImage from './receipt.png';
import './styles.scss';
import { useCallback, useState } from 'react';

const extraBonus: { [k: number]: number } = {
  28: 5,
  90: 10,
  180: 20,
};

export default function PearlChestsLockup() {
  const { t } = useTranslation();
  const [lockupResult, setLockupResult] = useState<any>();
  const pearlVault = useSelector<IReduxState, IPearlVaultSliceState>(state => state.pearlVault);
  const dispatch = useDispatch();
  const selectTerm = useCallback((term?: ITerm) => dispatch(selectTermAction(term)), []);

  return (
    <div className="lockup">
      <Typography color="textPrimary" variant="h2" component="h2" className="lockup__title">
        {t('pearlChests.lockUp.title')}
      </Typography>
      <div className="lockup__options">
        {pearlVault.terms.map((term, i) => (
          <LockupOption key={i} term={term} onSelet={selectTerm} />
        ))}
      </div>
      <PearlChestLockupModal
        open={Boolean(pearlVault.selectedTerm)}
        onClose={() => selectTerm(undefined)}
        onSuccess={setLockupResult}
        discount={extraBonus[pearlVault.selectedTerm?.lockPeriod.toNumber() ?? 0] ?? 0}
        term={pearlVault.selectedTerm}
      />
      <PearlChestLockupSuccessModal open={lockupResult} onClose={() => setLockupResult(undefined)} />
    </div>
  );
}

function LockupOption({ term, onSelet }: { term: ITerm; onSelet: (settings: ITerm | undefined) => void }) {
  const { t } = useTranslation();
  const showBadge = term.lockPeriod.toNumber() >= 90;
  const multiplier = Number((term.multiplier / 100).toFixed(1));
  const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
    return state.pendingTransactions;
  });
  const { address, connect } = useWeb3Context();
  const apy = useSelector<IReduxState, number>(state => Math.floor(state.app.stakingAPY * 100));

  return (
    <Paper className="lockup-option">
      {showBadge && (
        <div className="lockup-option__badge">
          <Typography className="lockup-option__badge-label" variant="caption">
            {t('pearlChests.lockUp.boost')}
          </Typography>
          <Typography className="lockup-option__badge-value" component="span">
            X{multiplier}
          </Typography>
          <Paper className="lockup-option__badge-after" />
          <Paper className="lockup-option__badge-before" />
        </div>
      )}

      <div className="lockup-option__content">
        <div>
          <Typography className="lockup-option__days" component="span">
            {term.lockPeriod.toNumber()}
          </Typography>
          <Typography className="lockup-option__days-label" component="span">
            {t('pearlChests.lockUp.days')}
          </Typography>
        </div>

        <Divider className="lockup-option__div" />

        <div>
          <Typography className="lockup-option__label" variant="caption" component="span">
            {t('pearlChests.lockUp.rewardBoost')} <InfoTooltip message="test" />
          </Typography>
          <Typography className="lockup-option__value" component="span">
            x{multiplier}
          </Typography>
        </div>

        <Divider className="lockup-option__div" />

        <div>
          <Typography className="lockup-option__label" variant="caption" component="span">
            {t('pearlChests.lockUp.expectedAPY')} <InfoTooltip message="test" />
          </Typography>
          <Typography className="lockup-option__value" component="span">
            {formatApy(apy * multiplier)}%
          </Typography>
        </div>

        <Divider className="lockup-option__div" />

        <div>
          <Typography className="lockup-option__label" variant="caption" component="span">
            {t('pearlChests.lockUp.youWillGet')}
          </Typography>
          <img className="lockup-option__receipt" src={receiptImage} />
          <Typography className="lockup-option__nft-name" component="span">
            {t(term.note.name)}
          </Typography>
        </div>

        <div>
          {extraBonus[term.lockPeriod.toNumber()] && (
            <>
              <Typography className="lockup-option__bonus-title" component="span">
                {t('pearlChests.lockUp.bonusTitle', { percentage: extraBonus[term.lockPeriod.toNumber()] })}
              </Typography>
              <Typography className="lockup-option__bonus-desc" variant="caption" component="span">
                {t('pearlChests.lockUp.bonusDescription')}
              </Typography>
              <Typography className="lockup-option__requirement" variant="caption" component="span">
                {t('pearlChests.lockUp.nftRequirement', { amount: term.minLockAmount.toNumber() })}
              </Typography>
            </>
          )}
          {!extraBonus[term.lockPeriod.toNumber()] && (
            <Typography component="span" variant="caption">
              {t('pearlChests.lockUp.noExtraBonus')}
            </Typography>
          )}
        </div>
      </div>

      <ActionButton
        className="lockup-option__select-btn"
        pendingTransactions={pendingTransactions}
        type="select_lockup_option"
        start={t(address ? 'pearlChests.lockUp.select' : 'common.connectWallet')}
        progress="Processing..."
        processTx={() => (address ? onSelet(term) : connect())}
      />
    </Paper>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useWeb3Context } from '../../hooks';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { tabletMediaQuery } from 'src/themes/mediaQuery';

import { Box, Grid, Paper, Zoom, Slide, Typography, makeStyles } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import BondRowHeader from './BondRowHeader';
import BondRow from './BondRow';
import BondCard from './BondCard';
import BondDialog from '../BondDialog';
import BondSuccessDialog from '../BondDialog/SuccessDialog/BondSuccessDialog';
import BondNTFDiscountDialog from '../BondDialog/BondNFTDiscountDialog';
import RedeemSuccessDialog from '../BondDialog/SuccessDialog/RedeemSuccessDialog';
import './choose-bond.scss';

import apollo from 'src/lib/apolloClient';
import { Bonding, Bond, BondKeys, getBond } from 'src/constants';
import { getTokenImage, trim } from '../../helpers';
import { IReduxState } from '../../store/slices/state.interface';
import { checkBondKey } from './utils';
import { NFTDiscountOption } from '../BondDialog/types';
import { MOCKED_NFT_OPTIONS, NFT } from '../BondDialog/BondNFTDiscountDialog/constants';
import { useAppSelector } from 'src/store/hook';
import { NFTType } from 'src/store/actions/nft-action';

const MOCKED_NFT_ROW_DATA = [
  {
    name: 'Furry-Hand Otter (2021 Winter)',
    type: 'nft' as NFTType,
    id: 123,
    key: 'FURRY' as NFT,
    discount: 0.05,
    endDate: new Date(),
  },
  {
    name: 'Furry-Hand Otter (2021 Winterrrrrrr)',
    type: 'nft' as NFTType,
    id: 123,
    key: 'FURRY' as NFT,
    discount: 0.05,
    endDate: new Date(),
  },
];

const useStyle = makeStyles(theme => {
  return {
    heroCard: {
      backgroundColor: theme.palette.mode.white,
    },
  };
});

function ChooseBond() {
  const { t } = useTranslation();
  const { chainID, provider, address: walletAddress } = useWeb3Context();
  const style = useStyle();
  const bonds = useMemo(() => {
    return BondKeys.map(key => getBond(key, chainID));
  }, []);
  const isTablet = useMediaQuery(tabletMediaQuery); // change to breakpoint query
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);

  const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);
  const marketPrice = useSelector<IReduxState, number>(state => {
    return state.app.marketPrice;
  });

  useEffect(() => {
    apollo(`
query {
  protocolMetrics(first: 1, orderBy: timestamp, orderDirection: desc) {
    treasuryMarketValue
  }
}`).then(r => {
      const latestMetrics = (r as any)?.data.protocolMetrics[0];
      setTreasuryBalance(latestMetrics.treasuryMarketValue);
    });
  });

  const history = useHistory();
  const { location } = history;

  const pathname = location.pathname;
  const matches = pathname.match(/(\/bonds)\/([a-z_0-9]*)/);
  const bondKeyMatch = matches ? matches[2] : '';
  const bondKey = checkBondKey(bondKeyMatch) ? bondKeyMatch : undefined;
  const defaultBond = bondKey ? getBond(bondKey, chainID) : undefined;

  const [selectedBond, setSelectedBond] = useState<Bond | undefined>(defaultBond);
  const [nftDialogOpen, setNftDialogOpen] = useState(false);
  const [nftSelection, setNftSelection] = useState<NFTDiscountOption | undefined>(undefined);

  useEffect(() => {
    setSelectedBond(defaultBond);
  }, [bondKey]);

  const canSelect = useAppSelector(state => state.account.nfts).length > 0;
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const selectedAccountBond = useAppSelector(state => state.account?.[bondKey || '']);
  const selectedBonding = useAppSelector(state => state.bonding?.[bondKey || '']);
  // TODO: replace with fetched nft infos
  const MOCKED_NFT = MOCKED_NFT_OPTIONS[0];
  return (
    <div id="choose-bond-view">
      <Paper className="bond-paper">
        <Box className="bond-card-header">
          <p className="bond-title">
            {t('common.bond')} (
            <span className="bond-title-icon">
              {getTokenImage('clam', 24)},{getTokenImage('clam', 24)}
            </span>
            )
          </p>
        </Box>

        <Grid className="bond-hero-section" container spacing={2}>
          <Grid item xs={6}>
            <Box className={`bond-hero-card ${style.heroCard}`}>
              <Typography className="bond-hero-title" variant="h4" color="secondary">
                {t('common.treasuryBalance')}
              </Typography>

              <Box component="p" color="text.secondary" className="bond-hero-value">
                {!treasuryBalance ? (
                  <Skeleton width="180px" />
                ) : (
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                  }).format(treasuryBalance)
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className={`bond-hero-card ${style.heroCard}`}>
              <Typography className="bond-hero-title" variant="h4" color="secondary">
                {t('common.clamPrice')}
              </Typography>
              <Box component="p" color="text.secondary" className="bond-hero-value">
                {isAppLoading ? <Skeleton width="180px" /> : `$${trim(marketPrice, 2)}`}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {isTablet ? (
          <Slide direction="up" in={true}>
            <Grid container className="bond-card-container">
              {bonds.map(bond => (
                <Grid item xs={12} key={bond.key} onClick={() => setSelectedBond(bond)}>
                  <BondCard key={bond.key} bondKey={bond.key} nft={MOCKED_NFT} />
                </Grid>
              ))}
            </Grid>
          </Slide>
        ) : (
          <Zoom in>
            <Grid className="bond-row-container" item xs={12} aria-label="Available bonds">
              <BondRowHeader />
              {bonds.map(bond => (
                <Box key={bond.key} onClick={() => setSelectedBond(bond)}>
                  <BondRow bondKey={bond.key} nft={MOCKED_NFT} />
                </Box>
              ))}
            </Grid>
          </Zoom>
        )}
      </Paper>
      {selectedBond && selectedAccountBond && selectedBonding && (
        <BondDialog
          bond={selectedBond}
          canSelect={canSelect}
          selection={nftSelection}
          selectedBonding={selectedBonding}
          selectedAccountBond={selectedAccountBond}
          setBond={setSelectedBond}
          setSelection={setNftSelection}
          setNftDialogOpen={setNftDialogOpen}
        />
      )}
      {selectedBond && bondKey === 'mai_clam44' && (
        <>
          <BondNTFDiscountDialog
            open={nftDialogOpen}
            bond={selectedBond}
            selection={nftSelection}
            setSelection={setNftSelection}
            onClose={() => setNftDialogOpen(false)}
          />
        </>
      )}
      {/** TODO: connect selected bonded data */}
      {selectedBond && bondKey === 'mai_clam44' && nftSelection && (
        <BondSuccessDialog
          bond={selectedBond}
          selection={nftSelection}
          selectedBonding={selectedBonding}
          selectedAccountBond={selectedAccountBond}
          open={false}
          onClose={() => setSuccessDialogOpen(false)}
        />
      )}
      {/** TODO: connect selected redeemed data */}
      {selectedBond && (
        <RedeemSuccessDialog
          bond={selectedBond}
          selections={MOCKED_NFT_ROW_DATA}
          open={false}
          onClose={() => {}}
          balance={'100'}
          pendingPayout={'0'}
        />
      )}
    </div>
  );
}

export default ChooseBond;

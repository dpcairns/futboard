import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  getAllLeagues,
  getAllTeamsByLeague,
  logout,
  getProfile,
  updateProfile,
  getUser,
} from '../../services/supabase-utils';
import { Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { useStateContext } from '../../StateProvider';
import './profile-setup.scss';
import { useHistory } from 'react-router-dom';

const steps = ['Select favorite league', 'Select other leagues to follow'];

export default function ProfileSetupPage() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [teams, setTeams] = React.useState([]);
  const [leagueID, setLeagueID] = React.useState(61);
  const [leagues, setLeagues] = React.useState([]);
  const [profileForm, setProfileForm] = React.useState({});
  const { currentProfile, setCurrentProfile, currentUser, setCurrentUser } = useStateContext();
  const { push } = useHistory();

  // React.useEffect(() => {

  // }, [leagueID]);

  React.useEffect(() => {
    async function load() {
      const response = await getAllTeamsByLeague(leagueID);
      setTeams(response);
    }
    async function load2() {
      const response = await getAllLeagues();
      setLeagues(response);
      if (currentUser.id) {
        const profile = await getProfile(currentUser.id);
        setCurrentProfile(profile);
      }
    }
    load();
    load2();
  }, [leagueID]);

  // React.useEffect(() => {
  //   async function loadUser() {
  //     if (!currentUser) {
  //       const user = await getUser();
  //       setCurrentUser(user);
  //     }
  //   }
  //   loadUser();
  // }, []);

  const isStepOptional = (step) => {
    return step === 1;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };
  async function loadTeams(leagueID) {
    const response = await getAllTeamsByLeague(leagueID);
    setTeams(response);
  }

  const handleLeagueChange = (event) => {
    setLeagueID(event.target.value);

    loadTeams(event.target.value);
  };

  const handleNext = async () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    if (activeStep === 0) {
      currentProfile.step_1_complete = true;
    }
    if (activeStep === 1) {
      currentProfile.step_2_complete = true;
    }
    if (activeStep === 2) {
      push('/home');
    }
    await updateProfile(currentProfile, currentProfile.id);

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  function handleStep1(league_id) {
    currentProfile.favorite_league = league_id;
    currentProfile.followed_leagues = [league_id];
    console.log(currentProfile);
  }

  function handleStep2(league_id) {
    if (currentProfile.followed_leagues.includes(league_id)) {
      const index = currentProfile.followed_leagues.findIndex(
        (currentValue) => currentValue === league_id
      );
      currentProfile.followed_leagues.splice(index, 1);
    } else {
      currentProfile.followed_leagues.push(league_id);
    }
    console.log(currentProfile);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepOptional(index)) {
            labelProps.optional = <Typography variant="caption">Optional</Typography>;
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {activeStep === 0 && (
        <div>
          <div className="card_div">
            {leagues.map((league) => {
              return (
                <label className="setup_card" key={league.league_id}>
                  <input
                    name="leagues"
                    type="radio"
                    value={league.league_id}
                    onChange={(e) => handleStep1(e.target.value)}
                  />
                  {league.league_name}
                  <span>
                    <img alt={league.league_name} src={league.league_logo} />
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      {activeStep === 1 && (
        <div>
          <div className="card_div">
            {leagues.map((league) => {
              if (currentProfile.favorite_league === league.league_id) {
                return (
                  <label className="setup_card" key={league.league_id}>
                    <input
                      checked={true}
                      disabled
                      type="checkbox"
                      value={league.league_id}
                      onChange={(e) => handleStep2(e.target.value)}
                    />
                    {league.league_name}
                    <span>
                      <img alt={league.league_name} src={league.league_logo} />
                    </span>
                  </label>
                );
              } else {
                return (
                  <label className="setup_card" key={league.league_id}>
                    <input
                      type="checkbox"
                      value={league.league_id}
                      onChange={(e) => {
                        handleStep2(e.target.value);
                      }}
                    />
                    {league.league_name}
                    <span>
                      <img alt={league.league_name} src={league.league_logo} />
                    </span>
                  </label>
                );
              }
            })}
          </div>
        </div>
      )}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        direction="row"
        rows={1}
        columns={2}
      >
        <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {isStepOptional(activeStep) && (
          <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
            Skip
          </Button>
        )}
        <Button onClick={handleNext}>{activeStep === steps.length - 1 ? 'Finish' : 'Next'}</Button>
        <Button onClick={logout}>logout</Button>
      </Grid>
    </Box>
  );
}

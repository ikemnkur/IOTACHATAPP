import React, { useEffect } from "react";
import { styled, alpha } from "@mui/material/styles";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  TextField,
  Box,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Typography,
  Paper,
  Chip,
  FormHelperText,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  Timer as TimerIcon,
  Money as MoneyIcon,
  Tag as TagIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  LockOutlined as LockIcon,
  MeetingRoom as RoomIcon,
  AltRoute as RouteIcon,
  StarRate as StarIcon,
} from "@mui/icons-material";
import useApp from "../../store/contexts/AppContext";

// Slide transition for the dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Styled components for better UI
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "#121212",
    borderRadius: 12,
    border: "1px solid #333",
    minWidth: "550px",
    maxWidth: "600px",
    [theme.breakpoints.down("sm")]: {
      minWidth: "calc(100% - 32px)",
      maxWidth: "calc(100% - 32px)",
      margin: 16,
    },
  },
  "& .MuiDialogTitle-root": {
    padding: theme.spacing(3),
    backgroundColor: "#1E1E1E",
    color: theme.palette.common.white,
    borderBottom: "1px solid #333",
  },
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
    backgroundColor: "#1A1A1A",
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(2, 3),
    backgroundColor: "#1E1E1E",
    borderTop: "1px solid #333",
  },
}));

const StyledTabList = styled(TabList)(({ theme }) => ({
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: 1.5,
  },
  "& .MuiTab-root": {
    textTransform: "none",
    fontSize: 15,
    fontWeight: 500,
    minWidth: "auto",
    padding: theme.spacing(1.5, 2),
    color: alpha(theme.palette.common.white, 0.7),
    "&.Mui-selected": {
      color: theme.palette.common.white,
      fontWeight: 600,
    },
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      color: theme.palette.common.white,
    },
  },
}));

const StyledTabPanel = styled(TabPanel)({
  padding: "24px 0 0",
});

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FormRowDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  backgroundColor: alpha(theme.palette.common.white, 0.1),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    backgroundColor: alpha(theme.palette.common.white, 0.03),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.05),
    },
    "& fieldset": {
      borderColor: alpha(theme.palette.common.white, 0.2),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.common.white, 0.3),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputBase-input": {
    color: theme.palette.common.white,
  },
  "& .MuiInputLabel-root": {
    color: alpha(theme.palette.common.white, 0.7),
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
  // For the icon button
  "& .MuiIconButton-root": {
    color: alpha(theme.palette.common.white, 0.5),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.05),
    },
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    backgroundColor: alpha(theme.palette.common.white, 0.03),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.05),
    },
    "& fieldset": {
      borderColor: alpha(theme.palette.common.white, 0.2),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.common.white, 0.3),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputBase-input": {
    color: theme.palette.common.white,
  },
  "& .MuiInputLabel-root": {
    color: alpha(theme.palette.common.white, 0.7),
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
  // For dropdown icon
  "& .MuiSvgIcon-root": {
    color: alpha(theme.palette.common.white, 0.5),
  },
}));

const TeamSection = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.common.white, 0.03),
  borderRadius: 8,
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  boxSizing: 'border-box',
  width: '100%',
  '& .MuiTextField-root': {
    width: '100%',
    boxSizing: 'border-box'
  },
  '& .MuiOutlinedInput-root': {
    width: '100%',
    boxSizing: 'border-box'
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 3),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  color: alpha(theme.palette.common.white, 0.7),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.05),
    color: theme.palette.common.white,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: alpha(theme.palette.common.white, 0.9),
  fontSize: "0.9rem",
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  "& .MuiSvgIcon-root": {
    fontSize: "1.1rem",
    marginRight: theme.spacing(1),
    color: alpha(theme.palette.common.white, 0.6),
  },
}));

const FormFieldInfo = styled(Typography)(({ theme }) => ({
  color: alpha(theme.palette.common.white, 0.5),
  fontSize: "0.75rem",
  marginTop: 4,
}));

export default function RoomModal({
  roomMenuOpen,
  setRoomMenuOpen,
  customRoomModalTabValue,
}) {
  const {
    appState: { dataLoading },
    joinARoomApiCall,
    createARoomApiCall,
  } = useApp();

  const [tabValue, setTabValue] = React.useState(
    customRoomModalTabValue ?? "1"
  );
  const [showPassword1, setShowPassword1] = React.useState(false);
  const [showPassword2, setShowPassword2] = React.useState(false);
  const [roomDuration, setRoomDuration] = React.useState("");
  const [roomStreamTime, setRoomStreamTime] = React.useState("");
  const [roomTeamData, setRoomTeamData] = React.useState({
    roomTeamsCount: "",
    teamInfo: [],
  });

  //Coin fee for 30 mins room duration
  const roomCoinFeeToThirtyMins = 1;
  const roomMaxDurationThirtyMinsCount = 16;

  const roomDurationsAndFees = [];

  //Form array for room durations and fees
  for (let i = 0; i < roomMaxDurationThirtyMinsCount; i++) {
    const actualFee = i + roomCoinFeeToThirtyMins;
    const durationInMinutes = actualFee * 30;
    const durationInHours = durationInMinutes / 60;

    const objectData = {
      id: i + 1,
      total_minutes: durationInMinutes,
      duration: `${durationInHours} hours`,
      coin_fee: actualFee,
    };

    roomDurationsAndFees.push(objectData);
  }

  const handleClose = () => {
    setRoomMenuOpen(false);
  };

  const handleShowPassword1 = () => {
    setShowPassword1(!showPassword1);
  };

  const handleShowPassword2 = () => {
    setShowPassword2(!showPassword2);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRoomTeamsCountChange = (event) => {
    const count = event.target.value;
    setRoomTeamData((prevValues) => {
      const updatedTeamInfo = [...prevValues.teamInfo];

      // Check if the count is increasing or decreasing
      if (count > prevValues.roomTeamsCount) {
        // If increasing, add new entries for the additional teams
        for (let i = prevValues.roomTeamsCount; i < count; i++) {
          updatedTeamInfo.push({
            name: "",
            description: "",
          });
        }
      } else if (count < prevValues.roomTeamsCount) {
        // If decreasing, remove entries for the extra teams
        updatedTeamInfo.splice(count);
      }

      return {
        ...prevValues,
        roomTeamsCount: count,
        teamInfo: updatedTeamInfo,
      };
    });
  };

  const handleRoomTeamNameChange = (event, index) => {
    const { value } = event.target;
    setRoomTeamData((prevValues) => {
      const updatedTeamInfo = [...prevValues.teamInfo];
      updatedTeamInfo[index] = {
        ...updatedTeamInfo[index],
        name: value,
      };
      return {
        ...prevValues,
        teamInfo: updatedTeamInfo,
      };
    });
  };

  const handleRoomTeamDescriptionChange = (event, index) => {
    const { value } = event.target;
    setRoomTeamData((prevValues) => {
      const updatedTeamInfo = [...prevValues.teamInfo];
      updatedTeamInfo[index] = {
        ...updatedTeamInfo[index],
        description: value,
      };
      return {
        ...prevValues,
        teamInfo: updatedTeamInfo,
      };
    });
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();

    const roomId = event.target.roomId.value;
    const roomPasscode = event.target.roomPasscode.value;

    const dataToPass = {
      room_id: roomId,
      room_passcode: roomPasscode,
    };

    joinARoomApiCall(dataToPass);
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();

    const form = event.target;
    const roomName = form.roomName.value;
    const roomPasscode = form.roomPasscode.value;
    const roomJoinFee = form.roomJoinFee.value;
    const roomWatchFee = form.roomWatchFee.value;
    const roomDuration = form.roomDuration.value;
    const roomUserStreamTime = form.roomUserStreamTime.value;
    const roomUserXpLevel = form.roomUserXpLevel.value;
    const roomTeamLimit = form.roomTeamLimit.value;
    const roomTags = form.roomTags.value;
    const roomTeams = roomTeamData.teamInfo;

    const dataToPass = {
      name: roomName,
      // private_secret: roomPasscode,
      passcode: roomPasscode,
      join_fee: roomJoinFee,
      watch_fee: roomWatchFee,
      duration_in_mins: roomDuration,
      user_stream_time_in_mins: roomUserStreamTime,
      user_xp_level: roomUserXpLevel || "0",
      team_limit: roomTeamLimit,
      tags: roomTags,
      room_teams: roomTeams,
    };

    createARoomApiCall(dataToPass);
  };

  useEffect(() => {
    if (customRoomModalTabValue) {
      setTabValue(customRoomModalTabValue);
    }
  }, [customRoomModalTabValue]);

  return (
    <StyledDialog
      open={roomMenuOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
      maxWidth="md"
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {tabValue === "1" ? "Join a Chat Room" : "Create a New Room"}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TabContext value={tabValue}>
          <Box
            sx={{ borderBottom: 1, borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <StyledTabList
              onChange={handleTabChange}
              aria-label="room tabs"
              centered
            >
              <Tab
                label="Join Room"
                value="1"
                icon={<RoomIcon />}
                iconPosition="start"
              />
              <Tab
                label="Create Room"
                value="2"
                icon={<RouteIcon />}
                iconPosition="start"
              />
            </StyledTabList>
          </Box>

          {/* Join Room Tab */}
          <StyledTabPanel value="1">
            <Box
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={handleJoinRoom}
            >
              <FormSection>
                <SectionTitle>
                  <RoomIcon /> Room Information
                </SectionTitle>
                <StyledTextField
                  id="roomId"
                  name="roomId"
                  label="Room ID"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  required
                  placeholder="Enter the room ID to join"
                />
                <StyledTextField
                  margin="normal"
                  required
                  fullWidth
                  name="roomPasscode"
                  label="Room Passcode"
                  id="roomPasscode"
                  type={showPassword1 ? "text" : "password"}
                  placeholder="Enter the room password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleShowPassword1} edge="end">
                          {showPassword1 ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </FormSection>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <ActionButton
                  variant="contained"
                  color="primary"
                  type={dataLoading ? "button" : "submit"}
                  disabled={dataLoading}
                  size="large"
                  fullWidth
                  startIcon={
                    dataLoading && (
                      <CircularProgress size={20} color="inherit" />
                    )
                  }
                >
                  {dataLoading ? "Joining..." : "Join Room"}
                </ActionButton>
              </Box>
            </Box>
          </StyledTabPanel>

          {/* Create Room Tab */}
          <StyledTabPanel value="2">
            <Box
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={handleCreateRoom}
            >
              {/* Basic Room Information */}
              <FormSection>
                <SectionTitle>
                  <RoomIcon /> Room Details
                </SectionTitle>
                <StyledTextField
                  id="roomName"
                  name="roomName"
                  label="Room Name"
                  variant="outlined"
                  placeholder="Enter a name for your room"
                  required
                  fullWidth
                  margin="normal"
                />

                <StyledTextField
                  margin="normal"
                  required
                  fullWidth
                  name="roomPasscode"
                  label="Room Passcode"
                  id="roomPasscode"
                  placeholder="Create a password for your room"
                  type={showPassword2 ? "text" : "password"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleShowPassword2} edge="end">
                          {showPassword2 ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </FormSection>

              <FormRowDivider />

              {/* Pricing Section */}
              <FormSection>
                <SectionTitle>
                  <MoneyIcon /> Pricing
                </SectionTitle>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <StyledTextField
                    id="roomJoinFee"
                    name="roomJoinFee"
                    label="Join Chat Fee"
                    placeholder="Value in coins"
                    variant="outlined"
                    required
                    fullWidth
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Chip
                            label="Coins"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 193, 7, 0.1)",
                              color: "rgb(255, 193, 7)",
                              borderRadius: "4px",
                              height: "24px",
                              fontSize: "0.7rem",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <StyledTextField
                    id="roomWatchFee"
                    name="roomWatchFee"
                    label="Spectator Fee"
                    placeholder="Amount for watch time"
                    variant="outlined"
                    required
                    fullWidth
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Chip
                            label="Coins"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 193, 7, 0.1)",
                              color: "rgb(255, 193, 7)",
                              borderRadius: "4px",
                              height: "24px",
                              fontSize: "0.7rem",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </FormSection>

              <FormRowDivider />

              {/* Time Settings */}
              <FormSection>
                <SectionTitle>
                  <TimerIcon /> Time Settings
                </SectionTitle>
                <StyledFormControl fullWidth margin="normal">
                  <InputLabel required>Room Duration</InputLabel>
                  <Select
                    value={roomDuration}
                    onChange={(e) => setRoomDuration(e.target.value)}
                    label="Room Duration"
                    id="roomDuration"
                    name="roomDuration"
                    required
                  >
                    {roomDurationsAndFees.map((item) => (
                      <MenuItem key={item.id} value={item.total_minutes}>
                        {item.duration}{" "}
                        {`(${item.coin_fee} ${
                          item.id === 1 ? "coin" : "coins"
                        })`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                    How long the room will remain active
                  </FormHelperText>
                </StyledFormControl>

                <StyledFormControl fullWidth margin="normal">
                  <InputLabel required>User Stream Time</InputLabel>
                  <Select
                    value={roomStreamTime}
                    onChange={(e) => setRoomStreamTime(e.target.value)}
                    label="User Stream Time"
                    id="roomUserStreamTime"
                    name="roomUserStreamTime"
                    required
                  >
                    <MenuItem value={0.5}>30 Seconds</MenuItem>
                    <MenuItem value={1}>1 Minute</MenuItem>
                    <MenuItem value={1.5}>1 & Half Minute</MenuItem>
                    <MenuItem value={2}>2 Minutes</MenuItem>
                  </Select>
                  <FormHelperText sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                    How long each user can stream at a time
                  </FormHelperText>
                </StyledFormControl>
              </FormSection>

              <FormRowDivider />

              {/* Team Settings */}
              <FormSection>
                <SectionTitle>
                  <PeopleIcon /> Team Settings
                </SectionTitle>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <StyledTextField
                    id="roomUserXpLevel"
                    name="roomUserXpLevel"
                    label="Min. XP Level"
                    placeholder="Leave empty for no minimum"
                    variant="outlined"
                    fullWidth
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StarIcon
                            sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <StyledTextField
                    id="roomTeamLimit"
                    name="roomTeamLimit"
                    label="Team Size Limit"
                    placeholder="Max users per team"
                    variant="outlined"
                    required
                    fullWidth
                    type="number"
                    inputProps={{ min: 1 }}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon
                            sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <StyledFormControl fullWidth margin="normal">
                  <InputLabel required>Number of Teams</InputLabel>
                  <Select
                    value={roomTeamData.roomTeamsCount}
                    onChange={handleRoomTeamsCountChange}
                    label="Number of Teams"
                    id="roomTeamsCount"
                    name="roomTeamsCount"
                    required
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <MenuItem key={index + 1} value={index + 1}>
                        {index + 1} {index + 1 === 1 ? "Team" : "Teams"}
                      </MenuItem>
                    ))}
                  </Select>
                </StyledFormControl>

                <StyledTextField
                  id="roomTags"
                  name="roomTags"
                  label="Room Tags"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  placeholder="Enter up to 5 #tags separated by commas"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormFieldInfo>
                  Tags help others find your room. Example: #gaming #casual
                  #strategy
                </FormFieldInfo>
              </FormSection>

              {/* Team Configurations - ONLY THIS SECTION IS MODIFIED */}
              {roomTeamData.roomTeamsCount > 0 && (
                <FormSection>
                  <SectionTitle>
                    <GroupIcon /> Team Configuration
                  </SectionTitle>
                  {Array.from(
                    { length: roomTeamData.roomTeamsCount },
                    (_, index) => {
                      const currentIndexId = index + 1;
                      return (
                        <TeamSection key={currentIndexId} elevation={0}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "white",
                              mb: 2,
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={`Team ${currentIndexId}`}
                              size="small"
                              color="primary"
                              sx={{ borderRadius: "4px", height: "24px" }}
                            />
                          </Typography>

                          <Box sx={{ width: "100%" }}>
                            <StyledTextField
                              id={`roomTeamName${currentIndexId}`}
                              name={`roomTeamName${currentIndexId}`}
                              label="Team Name"
                              variant="outlined"
                              fullWidth
                              margin="normal"
                              placeholder="Enter name (maximum of 20 chars)"
                              InputProps={{
                                inputProps: {
                                  maxLength: 20,
                                  minLength: 1,
                                },
                                sx: { width: "100%" }, // Ensure input takes full width
                              }}
                              sx={{ width: "100%" }} // Ensure text field takes full width
                              value={roomTeamData.teamInfo[index].name}
                              onChange={(event) =>
                                handleRoomTeamNameChange(event, index)
                              }
                            />
                          </Box>

                          <Box sx={{ width: "100%" }}>
                            <StyledTextField
                              id={`roomTeamsDescription${currentIndexId}`}
                              name={`roomTeamsDescription${currentIndexId}`}
                              label="Team Description"
                              variant="outlined"
                              fullWidth
                              multiline
                              rows={3}
                              margin="normal"
                              placeholder="Describe this team and its purpose"
                              InputProps={{
                                sx: { width: "100%" }, // Ensure input takes full width
                              }}
                              sx={{ width: "100%" }} // Ensure text field takes full width
                              value={roomTeamData.teamInfo[index].description}
                              onChange={(event) =>
                                handleRoomTeamDescriptionChange(event, index)
                              }
                            />
                          </Box>
                        </TeamSection>
                      );
                    }
                  )}
                </FormSection>
              )}

              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <ActionButton
                  variant="contained"
                  color="primary"
                  type={dataLoading ? "button" : "submit"}
                  disabled={dataLoading}
                  size="large"
                  fullWidth
                  startIcon={
                    dataLoading && (
                      <CircularProgress size={20} color="inherit" />
                    )
                  }
                >
                  {dataLoading ? "Creating..." : "Create Room"}
                </ActionButton>
              </Box>
            </Box>
          </StyledTabPanel>
        </TabContext>
      </DialogContent>

      <DialogActions>
        <CancelButton onClick={handleClose}>Cancel</CancelButton>
      </DialogActions>
    </StyledDialog>
  );
}

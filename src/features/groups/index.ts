// Types
export type {
  GroupRow,
  GroupMemberRow,
  GroupRole,
  CurrentGroupResponse,
  GroupMemberWithProfile,
  GroupInviteRow,
  CreateInviteParams,
  CreateInviteResponse,
  RedeemInviteResponse,
} from "./types";

// Queries & Keys
export {
  groupKeys,
  fetchCurrentGroup,
  fetchGroupsList,
  setCurrentGroup,
  fetchGroupMembers,
  createInvite,
  redeemInvite,
} from "./queries";

// Hooks
export {
  useCurrentGroup,
  useGroupsList,
  useSetCurrentGroup,
  useGroupMembers,
  useCreateInvite,
  useRedeemInvite,
} from "./hooks";

// Components
export { GroupSwitcher } from "./components";

// Service
export { ensureProfileAndDefaultGroup } from "./service";

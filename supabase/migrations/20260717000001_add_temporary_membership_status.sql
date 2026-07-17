-- Add 'temporary' as valid membership_status value
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_membership_status_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_membership_status_check
CHECK (membership_status IN ('pending', 'approved', 'rejected', 'temporary', 'active'));

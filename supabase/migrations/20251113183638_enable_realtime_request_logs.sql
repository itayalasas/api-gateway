/*
  # Enable Realtime for request_logs table

  1. Changes
    - Enable realtime publication for request_logs table
    - This allows real-time subscriptions to work properly

  2. Purpose
    - Enable automatic log updates in the UI without manual refresh
    - Improve user experience with instant feedback
*/

-- Enable realtime for request_logs
ALTER PUBLICATION supabase_realtime ADD TABLE request_logs;
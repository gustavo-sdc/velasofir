begin;
alter table public.workshops add column youtube_videos text[] not null default '{}';
alter table public.workshops add constraint workshops_youtube_videos_check check (
  cardinality(youtube_videos) <= 5
  and array_position(youtube_videos,null) is null
  and (cardinality(youtube_videos)=0 or array_to_string(youtube_videos,',') ~ '^https://www[.]youtube-nocookie[.]com/embed/[A-Za-z0-9_-]{11}(,https://www[.]youtube-nocookie[.]com/embed/[A-Za-z0-9_-]{11})*$')
);
commit;

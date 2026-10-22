+++
title = "About musiStats"
summary = "A music discovery app built around async data pipelines, listening habits, and finding something unexpected."
tags = ["Python", "FastAPI", "Data Pipelines", "Machine Learning"]
project_url = "https://github.com/krypticlogan/musiStats"
+++

### What is it?

Put simply, it's an app to view and grow your musical personality, offering insight every step of the way.

Under the hood, musiStats is a Python/FastAPI service with PostgreSQL for persistence, async pipelines to grow and maintain the internal music library, and a small reinforcement learning component for selecting and ranking candidate tracks based on user history and feedback.

The core of the app is built on crowdsourcing via a reinforcement learning model which prioritizes novel song discovery (e.g. "You've showed little to no interest in this artist or genre before, but everything points to you enjoying it, check it out?").

This app is built for those who feel like they live on musical discovery or even just want a glimpse into their musical diet and how it could expand.

The goal is not for users to like everything they hear, in fact I may label that a failure. If a user finds a couple new artists or songs every week that they enjoy, and it broadens their musical horizons, then that is a win.

### Progress Update

- Developed async data pipelines for the expansion of the internal library of songs/albums/artists of interest from user libraries.
- Developed computational pipelines for things like a user's favorite artists/genres/songs, most similar music buddy, and other information that assists in finding something that you like and haven't heard yet.
- Developed a rudimentary RL model with the ability to recommend a song to a particular user, optimizing for discovery rather than guaranteed comfort picks.

**Currently working on** improving recommendation quality and user-facing identity; tuning how aggressively the model prioritizes novelty vs comfort, and how that's surfaced in the UI.

### Why?

This is a passion project for me, driven by my own frustrations and wants out of life. I figured if I couldn't get it somewhere else I may as well build it myself.

I found discovering new songs and artists for myself extremely difficult if I did not commit a lot of time to exploring the landscape at random.

Streaming services like Apple Music and Spotify weren't doing a good enough job. I concluded that there must be some easier way, and I remembered that a lot of the best music I find comes from my friends or strangers that shared it with me, so I built a system that facilitates that.

+++
title = "About zi(g)ameboy"
summary = "Building a Game Boy in Zig: timing, synchronization, and the hardware details hiding behind a familiar screen."
tags = ["Zig", "Low-level", "Systems", "Performance"]
project_url = "https://github.com/krypticlogan/gb"
+++

### What I'm Building

It's simple on its face: A Game Boy!

In more words, its a cycle-accurate emulation of the original DMG Game Boy (GBC planned), that aims to replicate the real behavior and timing quirks that children of the 90s grew up on. Along with that I want it to be accessible to others, so I will be porting it to WebASM, which Zig makes incredibly easy.

### Progress Update

**So far I have:**

- Designed the core elements of the system (CPU, GPU (PPU), MMIO and timing constraints)
- Iteratively tested for memory and computational performance using tools like *Tracy*

**Currently I am:**

- Working out kinks with timing and fixing failing test cases.
- Designing a performant rendering system that stays true to the original hardware.

### Challenges & Solutions

This project contained many challenges, but some of the most persistent and interesting ones include:

- **Synchronization and timing** | Getting the CPU, PPU, timers, and other peripherals to remain in sync with each other for millions of cycles required a good amount of upfront thought and careful design. I use a **shared clock ideology**, where the **CPU syncs real-time, and races to keep up with where it should be and peripherals walk in lockstep** with the CPU. If we end up slightly ahead, the system just sleeps until it's behind again. This keeps everything synced with **real-time, and true to the original hardware**'s 59.7 FPS.
- **Edge cases and nuance** | Systems like these have **lots of little things** that need to be considered along with the bigger picture. Finding what these little things are, and being able to **handle them gracefully** within the system that I created was highly motivating and **built into the design**.
- **Performance** | Performance has not been a glaring issue, but it is almost always worth mentioning. In a tight-looped and computationally extensive system such as the Game Boy, performance was something I had to keep in mind. It shouldn't be extremely difficult to emulate a 4.19 MHz console in real time on a modern machine, but certain design choices make this goal impossible. It was necessary to ensure that I was actively considering performance in development, as little things (like an inefficient data representation or slow computation) add up quickly. RAM hoarders are no fun either, so getting the memory footprint to be as small as possible is always a goal. Tools like Tracy and htop helped tremendously here.

### What I Learned

This project taught me a lot, including but not limited to:

- the essence of computers and why they work,
- the importance of foresight and planning,
<!-- how small hardware quirks (like interrupt timing or VRAM access rules) can force you to rethink otherwise clean abstractions, -->
- how to deal with truly difficult and elusive problems,
- to verify understanding and correctness upfront, and
- the utter madness of computer engineers and programmers in the 80s and 90s

### Why?

I learned about a new programming language called [Zig](https://ziglang.org/) and thought it was an interesting approach to programming that aligns with my philosophy.

I wanted to learn more about low-level programming and how computers really work. I had a decent mental model, but I hadn't *built* it yet.

So, after creating a simple snake game in the terminal, as well as a Chip8 Emulator, I decided something bigger was in order.

Prior to this project, I'd completed many projects in Python, a few in Java and C, but none of them hit me with the same enjoyment that making a complete retro game console in Zig did.

I would not be shocked if Zig continues to dominate my projects in scenarios where it is an option.

# Help — QueueGauge

## Overview
QueueGauge is a NestJS-powered API for monitoring job queues, managing background tasks, and visualizing operational throughput.

## Features
- **NestJS Architecture**: Scalable, modular backend with built-in validation pipes.
- **Job Management**: Dedicated controllers for enqueuing and tracking job status.
- **AuthLite Integration**: Lightweight device-key guarding for secure API access.

## How to Use
1. Use the Jobs API to submit new operational tasks to the queue.
2. Monitor the Dashboard endpoint for real-time queue depth and success rates.
3. Configure AuthLite keys in your environment to authorize client requests.

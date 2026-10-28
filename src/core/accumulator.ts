export interface PhysicsLoopOptions {
  fixedDeltaTime?: number; // e.g. 0.01 (100 Hz)
  maxSubSteps?: number;
  onPhysicsStep: (dt: number) => void;
  onRenderStep: (alpha: number) => void;
}

export class PhysicsAccumulator {
  private fixedDt: number;
  private maxSubSteps: number;
  private accumulator: number = 0;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private speedMultiplier: number = 1.0;

  private onPhysicsStep: (dt: number) => void;
  private onRenderStep: (alpha: number) => void;

  constructor(options: PhysicsLoopOptions) {
    this.fixedDt = options.fixedDeltaTime ?? 0.01;
    this.maxSubSteps = options.maxSubSteps ?? 10;
    this.onPhysicsStep = options.onPhysicsStep;
    this.onRenderStep = options.onRenderStep;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public pause(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  public stepOnce(dtOverride?: number): void {
    this.pause();
    const dt = dtOverride ?? this.fixedDt;
    this.onPhysicsStep(dt);
    this.onRenderStep(1.0);
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.05, Math.min(multiplier, 10.0));
  }

  public getSpeed(): number {
    return this.speedMultiplier;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public resetAccumulator(): void {
    this.accumulator = 0;
    this.lastTime = performance.now();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Guard against large time jumps (e.g. background tab)
    if (frameTime > 0.25) {
      frameTime = 0.25;
    }

    this.accumulator += frameTime * this.speedMultiplier;

    let subSteps = 0;
    while (this.accumulator >= this.fixedDt && subSteps < this.maxSubSteps) {
      this.onPhysicsStep(this.fixedDt);
      this.accumulator -= this.fixedDt;
      subSteps++;
    }

    const alpha = this.accumulator / this.fixedDt;
    this.onRenderStep(alpha);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public destroy(): void {
    this.pause();
  }
}

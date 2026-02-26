/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Locals {
      userKey?: string;
    }
  }
}

export {};

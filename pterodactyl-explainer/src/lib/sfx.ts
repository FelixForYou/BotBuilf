export type SfxName =
  | "click_soft" | "click_glass" | "click_low" | "type_short" | "type_long" | "panel_slide" | "panel_lift" | "panel_pass"
  | "swell_deep" | "swell_bright" | "settle" | "settle_light" | "msg_out" | "msg_in" | "data_flow" | "data_tick"
  | "status_on" | "status_warn" | "error_blip" | "line_draw" | "text_in" | "latch" | "warp" | "resolve"
  | "whip_fast" | "whip_low" | "whip_air" | "lens_pass" | "impact_soft" | "impact_card" | "impact_glass" | "flip" | "morph_up" | "morph_down"
  | "stack_ticks" | "scramble" | "rise_short";

/** at = absolute frame; vol relative (narration sits at 1.0); rate varies pitch so repeats differ. */
export type SfxCue = { at: number; name: SfxName; vol?: number; rate?: number };

export const s = (at: number, name: SfxName, vol = 0.5, rate = 1): SfxCue => ({ at, name, vol, rate });

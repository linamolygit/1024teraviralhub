-- Seed high-demand requested ad placements into production ad_placements table
INSERT INTO ad_placements (
  name, placement_key, ad_type, status,
  suppress_on_high_intent, suppress_on_checkout,
  frequency_cap_session, target_page, device_visibility
) VALUES 
('Global Header - Leaderboard Banner (Under Nav)', 'header_global_banner', 'responsive', 'active', 0, 1, 10, 'all', 'all'),
('Global Anchor Ad - High-CPM Sticky Bottom Banner', 'global_anchor_ad', 'sticky_anchor', 'active', 0, 1, 10, 'all', 'all'),
('Global Slider Ad - Floating Corner 300x250 Unit', 'global_slider_ad', 'slider', 'active', 0, 1, 5, 'all', 'all'),
('Global Vignette Ad - Interstitial Page Transition', 'global_vignette_ad', 'interstitial', 'active', 1, 1, 2, 'all', 'all'),
('Product Details - Top Header Leaderboard Banner', 'product_header_banner', 'responsive', 'active', 0, 1, 10, 'product', 'all'),
('Product Details - 300x250 Medium Rectangle Box', 'product_300x250_box', 'banner_300x250', 'active', 1, 1, 5, 'product', 'all'),
('Checkout Page - Top Leaderboard Ad Banner', 'checkout_top_banner', 'responsive', 'active', 0, 0, 5, 'checkout', 'all'),
('Checkout Page - 300x250 Sidebar Order Ad', 'checkout_sidebar_banner', 'banner_300x250', 'active', 0, 0, 5, 'checkout', 'all'),
('Checkout Page - Bottom Guarantee Ad Banner', 'checkout_bottom_banner', 'responsive', 'active', 0, 0, 5, 'checkout', 'all')
ON CONFLICT(placement_key) DO NOTHING;

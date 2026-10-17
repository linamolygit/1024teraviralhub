INSERT INTO website_settings (key, value, updated_at) VALUES ('legal_name', '"RISHAV MEDIA"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"RISHAV MEDIA"', updated_at = datetime('now');

INSERT INTO website_settings (key, value, updated_at) VALUES ('business_name', '"RISHAV MEDIA"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"RISHAV MEDIA"', updated_at = datetime('now');

INSERT INTO website_settings (key, value, updated_at) VALUES ('proprietor', '"RISHAV SRIVASTAWA"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"RISHAV SRIVASTAWA"', updated_at = datetime('now');

INSERT INTO website_settings (key, value, updated_at) VALUES ('contact_phone', '"+91 9801947855"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"+91 9801947855"', updated_at = datetime('now');

INSERT INTO website_settings (key, value, updated_at) VALUES ('contact_email', '"rishavsrivastawa9162@gmail.com"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"rishavsrivastawa9162@gmail.com"', updated_at = datetime('now');

INSERT INTO website_settings (key, value, updated_at) VALUES ('compliance_email', '"rishavsrivastawa9162@gmail.com"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"rishavsrivastawa9162@gmail.com"', updated_at = datetime('now');

INSERT INTO website_settings (key, value, updated_at) VALUES ('support_email', '"support@1024teraviralhub.com"', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = '"support@1024teraviralhub.com"', updated_at = datetime('now');

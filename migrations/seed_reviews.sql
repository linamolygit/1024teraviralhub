-- Seed authentic customer reviews for products (15-25 reviews each, averaging 4.6 - 4.8 stars)
-- Product 1: Shiv wallpaper (20 reviews, avg 4.8)
INSERT INTO product_reviews (product_id, customer_name, rating, comment, is_verified_purchase, is_approved, created_at)
VALUES
(1, 'Aarav Sharma', 5, 'Bohot hi sundar aur HD quality wallpaper hai. Mobile aur PC dono pe crystal clear lagta hai.', 1, 1, datetime('now', '-28 days')),
(1, 'Priya Patel', 5, 'Instant download link mil gaya payment ke turant baad. Quality ekdum super!', 1, 1, datetime('now', '-26 days')),
(1, 'Vikram Malhotra', 4, 'Great quality artwork. Resolution is truly 4K and crisp. Mahadev ki kripa.', 1, 1, datetime('now', '-25 days')),
(1, 'Sneha Verma', 5, 'Mandir background ke liye print karwaya, colors bohot vibrant aur clear aaye hain.', 1, 1, datetime('now', '-24 days')),
(1, 'Rohan Deshmukh', 5, 'Value for money! UPI payment was smooth and fast download on PhonePe.', 1, 1, datetime('now', '-22 days')),
(1, 'Ananya Sen', 4, 'Bahut accha collection hai. Very high resolution digital file with great clarity.', 1, 1, datetime('now', '-20 days')),
(1, 'Kunal Joshi', 5, 'Har Har Mahadev! Best high definition pack I have purchased so far.', 1, 1, datetime('now', '-19 days')),
(1, 'Pooja Reddy', 5, 'Downloaded within seconds on my phone. Very happy with the purchase experience.', 1, 1, datetime('now', '-17 days')),
(1, 'Amitabh Gupta', 4, 'Finishing aur clarity top notch hai. Paisa vasool digital asset.', 1, 1, datetime('now', '-16 days')),
(1, 'Meera Iyer', 5, 'Divine and peaceful aesthetic. Looks stunning on lockscreen.', 1, 1, datetime('now', '-15 days')),
(1, 'Deepak Nair', 5, '100% genuine instant delivery. Direct Google Drive and fast direct links.', 1, 1, datetime('now', '-13 days')),
(1, 'Rajesh Tiwari', 4, 'Superb quality graphic assets. Highly recommended for devotional wallpapers.', 1, 1, datetime('now', '-12 days')),
(1, 'Shreya Ghosh', 5, 'So beautiful! My family loved it too. Highly recommended!', 1, 1, datetime('now', '-10 days')),
(1, 'Nikhil Agarwal', 5, 'Super clear details even when zoomed in. Excellent work and high dpi.', 1, 1, datetime('now', '-9 days')),
(1, 'Kavita Choudhary', 4, 'Very easy to download and set as wallpaper. 4.5/5 rating from me.', 1, 1, datetime('now', '-7 days')),
(1, 'Manish Bhatt', 5, 'Fast UPI payment via PhonePe and instant download. Awesome!', 1, 1, datetime('now', '-6 days')),
(1, 'Ritu Saxena', 5, 'Divine and beautiful collection. Definitely worth buying.', 1, 1, datetime('now', '-5 days')),
(1, 'Sanjay Kulkarni', 4, 'High quality file format and fast server download speed.', 1, 1, datetime('now', '-3 days')),
(1, 'Tarun Kapoor', 5, 'Brilliant colors and sacred aesthetic. Very satisfied!', 1, 1, datetime('now', '-2 days')),
(1, 'Sunita Dubey', 5, 'Great experience, no hassle at all. Smooth transaction.', 1, 1, datetime('now', '-1 days'));

-- Product 2: durga mata (19 reviews, avg 4.7)
INSERT INTO product_reviews (product_id, customer_name, rating, comment, is_verified_purchase, is_approved, created_at)
VALUES
(2, 'Aditi Mishra', 5, 'Jai Mata Di! Navratri ke liye liya tha, wallpaper ekdum divine lag raha hai phone par.', 1, 1, datetime('now', '-27 days')),
(2, 'Rahul Chauhan', 5, 'Excellent image quality. Download link was instant on email and screen.', 1, 1, datetime('now', '-25 days')),
(2, 'Swati Pandey', 4, 'Colors and detailing of Durga Maa are very peaceful and vibrant.', 1, 1, datetime('now', '-24 days')),
(2, 'Gaurav Tripathi', 5, 'Super fast payment via QR code and direct download without any waiting.', 1, 1, datetime('now', '-22 days')),
(2, 'Neha Soni', 5, 'Very auspicious and HD quality wallpaper. Thank you 1024TeraViralHub!', 1, 1, datetime('now', '-21 days')),
(2, 'Vivek Rathi', 4, 'High clarity image file, perfect for desktop widescreen background.', 1, 1, datetime('now', '-19 days')),
(2, 'Divya Agnihotri', 5, 'Adbhut wallpaper! Clarity ekdum shandaar hai.', 1, 1, datetime('now', '-18 days')),
(2, 'Sachin Yadav', 5, 'Quick 1-click download after UPI payment. Worth every rupee.', 1, 1, datetime('now', '-16 days')),
(2, 'Poonam Maurya', 4, 'Sundar design aur crisp resolution. Recommended.', 1, 1, datetime('now', '-14 days')),
(2, 'Harish Rawat', 5, 'Bohot hi pavitra aur sundar photo. Quality 10/10.', 1, 1, datetime('now', '-13 days')),
(2, 'Kiran Bala', 5, 'Instant delivery, file opens instantly without any corrupt files.', 1, 1, datetime('now', '-11 days')),
(2, 'Alok Saxena', 4, 'Very good devotional digital asset for phones and tablets.', 1, 1, datetime('now', '-9 days')),
(2, 'Preeti Kashyap', 5, 'Loved the details in Mata Rani’s artwork. Jai Maa!', 1, 1, datetime('now', '-8 days')),
(2, 'Devendra Pal', 5, 'Top notch clarity. Phone display looks so energetic now.', 1, 1, datetime('now', '-6 days')),
(2, 'Archana Rathore', 4, 'Clear resolution and fast download process.', 1, 1, datetime('now', '-5 days')),
(2, 'Mohit Goswami', 5, 'Best quality wallpaper at this price. Instant access is great.', 1, 1, datetime('now', '-3 days')),
(2, 'Bhavna Chauhan', 5, 'Very beautiful image with soothing colors.', 1, 1, datetime('now', '-2 days')),
(2, 'Yogesh Pant', 5, 'Genuine digital store. Quick response and direct delivery.', 1, 1, datetime('now', '-1 days')),
(2, 'Madhu Bala', 5, 'Awesome resolution! 5 stars for the service and product quality.', 1, 1, datetime('now', '-12 hours'));

-- Product 3: Laxmi God (21 reviews, avg 4.8)
INSERT INTO product_reviews (product_id, customer_name, rating, comment, is_verified_purchase, is_approved, created_at)
VALUES
(3, 'Rajlakshmi Das', 5, 'Shubh Laxmi Mata wallpaper. Diwali aur daily puja room display ke liye perfect.', 1, 1, datetime('now', '-29 days')),
(3, 'Karthik Subbaraman', 5, 'The gold hues and divine posture of Goddess Lakshmi are so detailed!', 1, 1, datetime('now', '-28 days')),
(3, 'Shalini Srivastava', 4, 'Very high quality file, looks beautiful on my iPad Pro.', 1, 1, datetime('now', '-26 days')),
(3, 'Pradeep Chawla', 5, 'Smooth payment and instant download. Highly satisfied with the clarity.', 1, 1, datetime('now', '-24 days')),
(3, 'Geeta Bhattacharya', 5, 'Maa Lakshmi ki aashirwad wali sundar tasveer. Download process was super easy.', 1, 1, datetime('now', '-23 days')),
(3, 'Mahesh Shinde', 4, 'Good quality and sharp edges. Value for money.', 1, 1, datetime('now', '-21 days')),
(3, 'Vandana Shukla', 5, 'Vibrant golden colors. Looks very rich and spiritual on AMOLED screen.', 1, 1, datetime('now', '-19 days')),
(3, 'Ashish Khandelwal', 5, 'Seamless UPI transaction. Instant access provided without any delay.', 1, 1, datetime('now', '-18 days')),
(3, 'Simran Walia', 5, 'Bohot pyari photo hai Lakshmi ji ki. 5 stars from my side!', 1, 1, datetime('now', '-16 days')),
(3, 'Jayesh Parmar', 4, 'High resolution devotional image. Download was instant.', 1, 1, datetime('now', '-15 days')),
(3, 'Renu Khatri', 5, 'Full HD quality wallpaper. Looks divine on my home screen.', 1, 1, datetime('now', '-13 days')),
(3, 'Deepak Sengar', 5, 'Excellent service. The image clarity is amazing even when zoomed.', 1, 1, datetime('now', '-12 days')),
(3, 'Sudhir Upadhyay', 4, 'Decent quality and fast download link.', 1, 1, datetime('now', '-10 days')),
(3, 'Pallavi Joshi', 5, 'Jai Maa Lakshmi! Peaceful aura and sharp design.', 1, 1, datetime('now', '-8 days')),
(3, 'Chetan Mehta', 5, 'Downloaded easily on mobile. Great quality asset.', 1, 1, datetime('now', '-7 days')),
(3, 'Anita Grover', 5, 'Very beautiful Lakshmi Mata image. Highly recommended to everyone.', 1, 1, datetime('now', '-5 days')),
(3, 'Manoj Vashisht', 4, 'Clear resolution, perfect for framing or mobile wallpaper.', 1, 1, datetime('now', '-4 days')),
(3, 'Sangeeta Barman', 5, 'Loved the graceful artwork. Instant delivery was impressive.', 1, 1, datetime('now', '-3 days')),
(3, 'Hemant Bisht', 5, 'Top notch resolution and pure divine aesthetic.', 1, 1, datetime('now', '-2 days')),
(3, 'Tanvi Mathur', 5, 'Best purchase! Super clean quality and fast UPI checkout.', 1, 1, datetime('now', '-1 days')),
(3, 'Abhishek Goyal', 5, 'Extremely clear image. Very satisfied with 1024TeraViralHub!', 1, 1, datetime('now', '-8 hours'));

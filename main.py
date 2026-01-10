from selenium import webdriver
from selenium.webdriver.common.by import By
import time

# Login
username = "your_email"
password = "your_password"
group_id = "group_id_here"

options = webdriver.ChromeOptions()
options.add_argument("--headless")
driver = webdriver.Chrome(options=options)

driver.get("https://www.facebook.com")
driver.find_element(By.NAME, "email").send_keys(username)
driver.find_element(By.NAME, "pass").send_keys(password)
driver.find_element(By.NAME, "login").click()

# Group page
driver.get(f"https://www.facebook.com/groups/{group_id}/")
time.sleep(3)

# Edit group settings
edit_btn = driver.find_element(By.XPATH, "//div[@aria-label='Edit group settings']")
edit_btn.click()
time.sleep(2)

# Group lock
lock_btn = driver.find_element(By.XPATH, "//div[@aria-label='Group lock']") # Check XPath
lock_btn.click()
time.sleep(1)
apply_lock = driver.find_element(By.XPATH, "//div[@aria-label='Apply']") # Check XPath
apply_lock.click()

# Nickname lock
nickname_lock = driver.find_element(By.XPATH, "//div[@aria-label='Nickname lock']") # Check XPath
nickname_lock.click()
time.sleep(1)
apply_nickname_lock = driver.find_element(By.XPATH, "//div[@aria-label='Apply']") # Check XPath
apply_nickname_lock.click()

driver.quit()

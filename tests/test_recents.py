import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

class TestAddfavs():
    def setup_method(self, method):
        self.driver = webdriver.Firefox()
        self.vars = {}
  
    def teardown_method(self, method):
        self.driver.quit()
  
    def test_recents(self):
        self.driver.get("http://localhost:8888/lab/")
        self.driver.implicitly_wait(40)
        # WebDriverWait(self.driver, 100)
        tests_folder = self.driver.find_element(By.XPATH, "//span[contains(text(),'tests')]")
        self.driver.implicitly_wait(30)
        actions = ActionChains(self.driver)
        actions.move_to_element(tests_folder)
        # print('before wait')
        
        #self.driver.implicitly_wait(10)
        
        actions.double_click(tests_folder).perform()
        self.driver.implicitly_wait(30)

        test_file = self.driver.find_element(By.XPATH, "//span[contains(text(),'test_file.rtf')]")
        self.driver.implicitly_wait(30)
        actions = ActionChains(self.driver)
        actions.double_click(test_file).perform()

        self.driver.implicitly_wait(30)
        file_elem = self.driver.find_element(By.XPATH, "/html/body/div/div[2]/div[2]/ul/li[1]") 
        actions = ActionChains(self.driver)
        self.driver.implicitly_wait(30)
        actions.click(file_elem).perform()

        recents = self.driver.find_element(By.XPATH, "//div[contains(text(),'Recents')]")
        actions = ActionChains(self.driver)
        self.driver.implicitly_wait(30)
        actions.click(recents).perform()
        self.driver.implicitly_wait(30)

        folder_recent = self.driver.find_element(By.XPATH, "//div[contains(text(),'tmp/jupyterlab-recents/tests')]")
        assert folder_recent.text == "/tmp/jupyterlab-recents/tests"

        file_recent = self.driver.find_element(By.XPATH, "//div[contains(text(),'tmp/jupyterlab-recents/tests/test_file.rtf')]")
        assert file_recent.text == "/tmp/jupyterlab-recents/tests/test_file.rtf"

        # file_elem = self.driver.find_element(By.XPATH, "/html/body/div/div[2]/div[2]/ul/li[1]") 
        # actions.click(file_elem).perform()
        # self.driver.implicitly_wait(30)
        #recents = self.driver.find_element(By.XPATH, "//div[contains(text(),'Recents')]")
        #recents = self.driver.find_element(By.XPATH, "/html/body/div[2]/ul/li[6]")
        # recents = self.driver.find_element_by_css_selector("li.lm-Menu-item:nth-child(7)")
        # actions = ActionChains(self.driver)
        # actions.click(recents).perform()
        clear_recents = self.driver.find_element(By.XPATH, "//div[contains(text(),'Clear Recents')]")
        actions = ActionChains(self.driver)
        self.driver.implicitly_wait(30)
        actions.click(clear_recents).perform()
        self.driver.implicitly_wait(30)
        # actions.click(file_elem).perform()
        # actions.click(recents).perform()
        # cleared_txt = self.driver.find_element(By.XPATH, "/html/body/div[3]/ul/li")
        # assert cleared_txt.text == "Clear Recents"
        # WebDriverWait(self.driver, 100)

        #home_folder = self.driver.find_element(By.XPATH, "/html/body/div[2]/div[3]/div[2]/div[1]/div[5]/div[2]/span[1]")
        #home_folder = self.driver.find_element(By.XPATH, "/html/body/div/div[3]/div[2]/div[1]/div[6]/div[2]/span[1]")
        home_folder = self.driver.find_element_by_css_selector(".jp-BreadCrumbs-home")
        #home_folder = self.driver.find_element(By.XPATH, "/html/body/div/div[3]/div[2]/div[1]/div[6]/div[2]/span[1]/svg")
        actions = ActionChains(self.driver)
        self.driver.implicitly_wait(30)
        actions.click(home_folder).perform()


if __name__ == '__main__':
  setup_method()
  test_recents()
  teardown_method()
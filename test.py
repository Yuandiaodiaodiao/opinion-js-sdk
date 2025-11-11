import os
os.environ['HTTP_PROXY']="http://172.28.80.1:7890"
os.environ['HTTPS_PROXY']="http://172.28.80.1:7890"
os.environ['http_proxy']="http://172.28.80.1:7890"
os.environ['https_proxy']="http://172.28.80.1:7890"
from dotenv import load_dotenv
from opinion_clob_sdk import Client
os.environ['HTTP_PROXY']="http://172.28.80.1:7890"
os.environ['HTTPS_PROXY']="http://172.28.80.1:7890"
os.environ['http_proxy']="http://172.28.80.1:7890"
os.environ['https_proxy']="http://172.28.80.1:7890"
# Load environment variables
load_dotenv()
os.environ['HTTP_PROXY']="http://172.28.80.1:7890"
os.environ['HTTPS_PROXY']="http://172.28.80.1:7890"
os.environ['http_proxy']="http://172.28.80.1:7890"
os.environ['https_proxy']="http://172.28.80.1:7890"
# Initialize client
print(os.getenv('PRIVATE_KEY'))
client = Client(
    host='https://proxy.opinion.trade:8443',
    apikey=os.getenv('API_KEY'),
    chain_id=56,  # BNB Chain mainnet
    rpc_url=os.getenv('RPC_URL'),
    private_key=os.getenv('PRIVATE_KEY'),
    multi_sig_addr=os.getenv('MULTI_SIG_ADDRESS'),
    conditional_tokens_addr=os.getenv('CONDITIONAL_TOKEN_ADDR'),
    multisend_addr=os.getenv('0x998739BFdAAdde7C933B942a68053933098f9EDa')
)
# Step 2: Sell YES tokens
from opinion_clob_sdk.chain.py_order_utils.model.order import PlaceOrderDataInput
from opinion_clob_sdk.chain.py_order_utils.model.sides import OrderSide
from opinion_clob_sdk.chain.py_order_utils.model.order_type import LIMIT_ORDER

order = PlaceOrderDataInput(
    marketId=1708,
    tokenId='37029929800985239120461077343514542950048857363074104543068606430978923968964',
    side=OrderSide.BUY,
    orderType=LIMIT_ORDER,
    price='0.01',
    makerAmountInBaseToken=600  # BUY 100 YES
)
res = client.place_order(order)
print(res)

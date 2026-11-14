import streamlit as st

st.set_page_config(page_title="FraudGraph AI", page_icon="🔎", layout="wide")

st.title("FraudGraph AI")
st.caption("Real-time fraud and mule network detection prototype")
st.info(
    "Repository scaffold is ready. Transaction ingestion, graph analysis, risk scoring, "
    "and the investigator dashboard are the next implementation steps."
)

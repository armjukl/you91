// pages/autohk.ts
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { NextApiResponse } from 'next';

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const { res } = context;

  // 设置重定向头部
  res.writeHead(302, { Location: 'https://sub.miku0.dpdns.org/api/subscribe?host=notls.idc0.eu.org&uuid=3e959859-a060-48f3-ca11-67f7fa9af139&path=%2F&type=ws' });
  res.end();

  return { props: {} };
};

function RedirectPage() {
  return null;
}

export default RedirectPage;

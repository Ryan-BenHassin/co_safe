import { useEffect, useState } from 'react'
import { Box, Grid, Heading } from '@chakra-ui/react'
import ServiceCard from '../components/ServiceCard'
import Layout from '../components/Layout'
import AlertsPanel from '../components/AlertsPanel'
import CameraForm from '../components/CameraForm'
import CameraList from '../components/CameraList'

const services = [
  {
    name: 'Cobot Safety',
    endpoint: process.env.NEXT_PUBLIC_COBOT_SERVICE_URL || 'http://localhost:5002',
    apiPath: '/analyze',
    description: 'Monitors cobot proximity to humans'
  },
  {
    name: 'Machine Safety',
    endpoint: process.env.NEXT_PUBLIC_MACHINE_SERVICE_URL || 'http://localhost:5003',
    apiPath: '/analyze',
    description: 'Monitors machine hazards'
  },
  {
    name: 'PPE Compliance',
    endpoint: process.env.NEXT_PUBLIC_PPE_SERVICE_URL || 'http://localhost:5004',
    apiPath: '/analyze',
    description: 'Monitors PPE usage'
  }
]

export default function Dashboard() {
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <Layout>
            <Box p={8}>
                <Heading mb={6}>Safety Monitoring Dashboard</Heading>
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6} mb={6}>
                    {services.map((service) => (
                        <ServiceCard key={service.name} {...service} />
                    ))}
                </Grid>
                <Grid templateColumns={["1fr", "1fr", "2fr 1fr"]} gap={6} mb={6}>
                    <CameraList />
                    <CameraForm onCameraAdded={() => setRefreshKey(prev => prev + 1)} />
                </Grid>
                <AlertsPanel />
            </Box>
        </Layout>
    )
}

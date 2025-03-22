import { Box, Heading, Text, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, Switch, HStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Camera {
  id: string
  name: string
  location: string
  type: string
  status: string
  simulating?: boolean
}

interface Log {
  timestamp: string
  event: string
  result: string
}

export default function CameraList() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [logs, setLogs] = useState<Record<string, Log[]>>({})

  const fetchCameras = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras`)
      setCameras(response.data)
    } catch (error) {
      console.error('Failed to fetch cameras:', error)
    }
  }

  const fetchLogs = async (cameraId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${cameraId}/logs`)
      setLogs(prev => ({...prev, [cameraId]: response.data}))
    } catch (error) {
      console.error(`Failed to fetch logs for camera ${cameraId}:`, error)
    }
  }

  const toggleSimulation = async (cameraId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${cameraId}/simulate`)
      fetchCameras() // Refresh camera list
    } catch (error) {
      console.error(`Failed to toggle simulation for camera ${cameraId}:`, error)
    }
  }

  useEffect(() => {
    fetchCameras()
    const interval = setInterval(fetchCameras, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box p={5}>
      <Heading size="md" mb={4}>Monitoring Cameras</Heading>
      <Accordion allowMultiple>
        {cameras.map(camera => (
          <AccordionItem key={camera.id}>
            <AccordionButton onClick={() => fetchLogs(camera.id)}>
              <Box flex="1" textAlign="left">
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="bold">{camera.name}</Text>
                    <Badge mr={2}>{camera.type}</Badge>
                    <Text fontSize="sm" color="gray.500">{camera.location}</Text>
                  </Box>
                  <Switch
                    isChecked={camera.simulating}
                    onChange={() => toggleSimulation(camera.id)}
                    colorScheme="green"
                  />
                </HStack>
              </Box>
            </AccordionButton>
            <AccordionPanel>
              {logs[camera.id]?.map((log, index) => (
                <Box key={index} p={2} borderBottomWidth="1px">
                  <Text fontSize="sm">{new Date(log.timestamp).toLocaleString()}</Text>
                  <Text>{log.event}: {log.result}</Text>
                </Box>
              ))}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  )
}
